import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResult {
  videoId: string;
  language: string;
  fullText: string;
  segments: TranscriptSegment[];
}

/**
 * YouTube 자막 추출 서비스
 * youtube-transcript 패키지 없이 자체 구현
 * YouTube 영상 페이지 요청 → timedtext URL 추출 → XML 자막 파싱
 */
@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  /**
   * YouTube 영상에서 자막 추출
   */
  async getTranscript(videoId: string, language: 'ko' | 'en' = 'ko'): Promise<TranscriptResult> {
    try {
      // 1단계: 영상 페이지에서 자막 트랙 정보 추출
      const captionTrackUrl = await this.getCaptionTrackUrl(videoId, language);

      if (!captionTrackUrl) {
        this.logger.warn(`자막 없음: videoId=${videoId}, lang=${language}`);
        return {
          videoId,
          language,
          fullText: '',
          segments: [],
        };
      }

      // 2단계: XML 자막 다운로드
      const segments = await this.downloadAndParseXml(captionTrackUrl);

      // 3단계: 전체 텍스트 조합
      const fullText = segments
        .map((s) => s.text.trim())
        .filter((t) => t.length > 0)
        .join(' ');

      return { videoId, language, fullText, segments };
    } catch (error) {
      this.logger.error(`자막 추출 실패: ${videoId}`, error);
      // 에러 시 빈 결과 반환 (전체 파이프라인 중단 방지)
      return {
        videoId,
        language,
        fullText: '[자막을 불러올 수 없습니다]',
        segments: [],
      };
    }
  }

  /**
   * YouTube 영상 페이지 HTML에서 timedtext URL 추출
   */
  private async getCaptionTrackUrl(videoId: string, language: string): Promise<string | null> {
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const res = await axios.get<string>(pageUrl, {
      headers: {
        'Accept-Language': language === 'ko' ? 'ko-KR,ko' : 'en-US,en',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const html = res.data;

    // ytInitialPlayerResponse JSON에서 captionTracks 추출
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let)\s/s);
    if (!playerResponseMatch?.[1]) {
      // 대체 패턴 시도
      return this.extractFromCaptionsScript(html, language);
    }

    try {
      const playerResponse = JSON.parse(playerResponseMatch[1]) as {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks?: Array<{
              baseUrl: string;
              languageCode: string;
              kind?: string;
            }>;
          };
        };
      };

      const tracks =
        playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

      // 요청 언어 자막 우선 탐색
      const exactMatch = tracks.find((t) => t.languageCode === language && !t.kind);
      if (exactMatch) return exactMatch.baseUrl;

      // ASR (자동 생성) 자막도 허용
      const asrMatch = tracks.find((t) => t.languageCode === language);
      if (asrMatch) return asrMatch.baseUrl;

      // 한국어 요청 시 영어 자막도 시도
      if (language === 'ko') {
        const enMatch = tracks.find((t) => t.languageCode === 'en');
        if (enMatch) return enMatch.baseUrl;
      }

      return tracks[0]?.baseUrl ?? null;
    } catch {
      return this.extractFromCaptionsScript(html, language);
    }
  }

  /**
   * 대체 추출 방법: HTML에서 직접 timedtext URL 파싱
   */
  private extractFromCaptionsScript(html: string, language: string): string | null {
    // "baseUrl":"https://www.youtube.com/api/timedtext..." 패턴 탐색
    const timedtextPattern = /"baseUrl":"(https:\/\/www\.youtube\.com\/api\/timedtext[^"]+)"/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = timedtextPattern.exec(html)) !== null) {
      // JSON 유니코드 이스케이프 디코딩
      const url = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      if (url.includes(`lang=${language}`)) {
        return url;
      }
      matches.push(url);
    }

    return matches[0] ?? null;
  }

  /**
   * XML 자막 파일 다운로드 및 파싱
   */
  private async downloadAndParseXml(url: string): Promise<TranscriptSegment[]> {
    const res = await axios.get<string>(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    return this.parseXmlTranscript(res.data);
  }

  /**
   * XML 자막 → TranscriptSegment 배열
   * 형식: <text start="0.5" dur="2.5">텍스트 내용</text>
   */
  private parseXmlTranscript(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // <text start="..." dur="...">...</text> 패턴
    const textPattern = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let match: RegExpExecArray | null;

    while ((match = textPattern.exec(xml)) !== null) {
      const rawText = match[3]
        // HTML 엔티티 디코딩
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        // HTML 태그 제거 (이탤릭 등)
        .replace(/<[^>]+>/g, '')
        .trim();

      if (rawText.length > 0) {
        segments.push({
          text: rawText,
          start: parseFloat(match[1]),
          duration: parseFloat(match[2]),
        });
      }
    }

    return segments;
  }
}
