import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  description: string;
}

export interface VideoStats {
  videoId: string;
  title: string;
  channelId: string;
  channelName: string;
  subscriberCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewSubRatio: number;
  thumbnailUrl: string;
}

export interface CommentItem {
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
}

export interface ChannelInfo {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  description: string;
}

export interface ChannelVideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
}

export interface TrendingVideoItem {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  viewCount: number;
  subscriberCount: number;
  viewSubRatio: number;
  publishedAt: string;
}

export interface ChannelSearchResult {
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  description: string;
}

const MOCK_VIDEOS: YouTubeVideoItem[] = [
  {
    videoId: 'mock_video_1',
    title: '[MOCK] 브레이크 패드 교환하는 방법',
    channelName: '꿈꾸는정비사',
    channelId: 'mock_channel_1',
    thumbnailUrl: 'https://via.placeholder.com/320x180',
    viewCount: 100000,
    likeCount: 5000,
    commentCount: 300,
    publishedAt: '2024-01-01T00:00:00Z',
    description: 'MOCK 응답 (API 키 없음)',
  },
];

@Injectable()
export class YoutubeApiService {
  private readonly logger = new Logger(YoutubeApiService.name);
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  // API 키 로테이션: YOUTUBE_API_KEY, YOUTUBE_API_KEY_2, YOUTUBE_API_KEY_3, ...
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private exhaustedKeys = new Set<number>(); // quota 초과된 키 인덱스
  private lastResetCheck = 0;

  constructor() {
    this.loadApiKeys();
  }

  private loadApiKeys() {
    const keys: string[] = [];
    const primary = process.env.YOUTUBE_API_KEY;
    if (primary) keys.push(primary);

    // YOUTUBE_API_KEY_2, _3, _4, ... 순서대로 탐색
    for (let i = 2; i <= 10; i++) {
      const key = process.env[`YOUTUBE_API_KEY_${i}`];
      if (key) keys.push(key);
    }

    this.apiKeys = keys;
    if (keys.length > 1) {
      this.logger.log(`YouTube API 키 ${keys.length}개 로드 (로테이션 활성)`);
    } else if (keys.length === 1) {
      this.logger.log('YouTube API 키 1개 로드');
    }
  }

  private get apiKey(): string | undefined {
    if (this.apiKeys.length === 0) return undefined;

    // 태평양 시간 자정 (한국 오후 4시)에 exhaustedKeys 리셋
    const now = Date.now();
    if (now - this.lastResetCheck > 60 * 60 * 1000) { // 1시간마다 체크
      const pst = new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
      const pstHour = new Date(pst).getHours();
      if (pstHour === 0 && this.exhaustedKeys.size > 0) {
        this.logger.log('YouTube API quota 리셋 — 모든 키 활성화');
        this.exhaustedKeys.clear();
        this.currentKeyIndex = 0;
      }
      this.lastResetCheck = now;
    }

    return this.apiKeys[this.currentKeyIndex];
  }

  /** quota 초과 시 다음 키로 전환. 모든 키 소진 시 false 반환 */
  private rotateKey(): boolean {
    this.exhaustedKeys.add(this.currentKeyIndex);
    this.logger.warn(`API 키 #${this.currentKeyIndex + 1} quota 초과 (${this.exhaustedKeys.size}/${this.apiKeys.length} 소진)`);

    // 다음 살아있는 키 찾기
    for (let i = 0; i < this.apiKeys.length; i++) {
      const nextIndex = (this.currentKeyIndex + 1 + i) % this.apiKeys.length;
      if (!this.exhaustedKeys.has(nextIndex)) {
        this.currentKeyIndex = nextIndex;
        this.logger.log(`API 키 #${nextIndex + 1}로 전환`);
        return true;
      }
    }

    this.logger.error('모든 YouTube API 키 quota 초과!');
    return false;
  }

  /** quota 에러인지 확인 */
  private isQuotaError(error: any): boolean {
    return error?.response?.status === 403 &&
      error?.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded';
  }

  private get isMockMode(): boolean {
    return this.apiKeys.length === 0;
  }

  /** YouTube API 호출 래퍼 — quota 초과 시 자동 키 로테이션 + 재시도 */
  private async youtubeGet<T = any>(endpoint: string, params: Record<string, any>): Promise<T> {
    const maxRetries = this.apiKeys.length;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await axios.get(`${this.baseUrl}/${endpoint}`, {
          params: { ...params, key: this.apiKey },
        });
        return res.data as T;
      } catch (error) {
        if (this.isQuotaError(error) && this.rotateKey()) {
          continue; // 다음 키로 재시도
        }
        throw error;
      }
    }
    throw new Error('모든 YouTube API 키 quota 초과');
  }

  /**
   * 키워드로 YouTube 영상 검색
   */
  async searchVideos(
    keyword: string,
    language: 'ko' | 'en' = 'ko',
    maxResults = 10,
    videoDuration?: 'short' | 'medium' | 'long',
  ): Promise<YouTubeVideoItem[]> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return MOCK_VIDEOS;
    }

    try {
      // 1단계: 영상 검색
      const searchData = await this.youtubeGet('search', {
        q: keyword,
        part: 'snippet',
        type: 'video',
        maxResults,
        relevanceLanguage: language,
        videoCaption: 'closedCaption',
        ...(videoDuration && { videoDuration }),
      });

      const items = searchData.items as Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          channelId: string;
          publishedAt: string;
          description: string;
          thumbnails: { medium: { url: string } };
        };
      }>;

      if (!items?.length) return [];

      const videoIds = items.map((item) => item.id.videoId).join(',');

      // 2단계: 통계 가져오기
      const statsData = await this.youtubeGet('videos', {
        id: videoIds,
        part: 'statistics',
      });

      const statsMap = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();
      for (const v of statsData.items as Array<{
        id: string;
        statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
      }>) {
        statsMap.set(v.id, {
          viewCount: parseInt(v.statistics.viewCount ?? '0', 10),
          likeCount: parseInt(v.statistics.likeCount ?? '0', 10),
          commentCount: parseInt(v.statistics.commentCount ?? '0', 10),
        });
      }

      return items.map((item) => {
        const stats = statsMap.get(item.id.videoId);
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          viewCount: stats?.viewCount ?? 0,
          likeCount: stats?.likeCount ?? 0,
          commentCount: stats?.commentCount ?? 0,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
        };
      });
    } catch (error) {
      this.logger.error('YouTube 검색 실패', error);
      throw error;
    }
  }

  /**
   * 특정 영상 통계 + 채널 구독자 수 조합
   */
  async getVideoStats(videoId: string): Promise<VideoStats> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return {
        videoId,
        title: '[MOCK] 영상 제목',
        channelId: 'mock_channel',
        channelName: '꿈꾸는정비사',
        subscriberCount: 52000,
        viewCount: 100000,
        likeCount: 5000,
        commentCount: 300,
        viewSubRatio: this.calculateViewSubRatio(100000, 52000),
        thumbnailUrl: 'https://via.placeholder.com/320x180',
      };
    }

    try {
      // 영상 정보 + 통계
      const videoResData = await this.youtubeGet('videos', {
        id: videoId,
        part: 'snippet,statistics',
      });

      const videoData = videoResData.items?.[0] as
        | {
            snippet: {
              title: string;
              channelId: string;
              channelTitle: string;
              thumbnails: { medium: { url: string } };
            };
            statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
          }
        | undefined;

      if (!videoData) {
        throw new Error(`영상을 찾을 수 없습니다: ${videoId}`);
      }

      const channelStats = await this.getChannelStats(videoData.snippet.channelId);

      const viewCount = parseInt(videoData.statistics.viewCount ?? '0', 10);
      const subscriberCount = channelStats.subscriberCount;

      return {
        videoId,
        title: videoData.snippet.title,
        channelId: videoData.snippet.channelId,
        channelName: videoData.snippet.channelTitle,
        subscriberCount,
        viewCount,
        likeCount: parseInt(videoData.statistics.likeCount ?? '0', 10),
        commentCount: parseInt(videoData.statistics.commentCount ?? '0', 10),
        viewSubRatio: this.calculateViewSubRatio(viewCount, subscriberCount),
        thumbnailUrl: videoData.snippet.thumbnails.medium.url,
      };
    } catch (error) {
      this.logger.error(`getVideoStats 실패: ${videoId}`, error);
      throw error;
    }
  }

  /**
   * 채널 통계 조회 (구독자 수 + 총 조회수 + 영상 수)
   */
  async getChannelStats(channelId: string): Promise<{ subscriberCount: number; totalViews: number; videoCount: number }> {
    if (this.isMockMode) {
      return { subscriberCount: 52000, totalViews: 5000000, videoCount: 120 };
    }

    try {
      const channelResData = await this.youtubeGet('channels', {
        id: channelId,
        part: 'statistics',
      });

      const channelData = channelResData.items?.[0] as
        | { statistics: { subscriberCount?: string; viewCount?: string; videoCount?: string } }
        | undefined;

      return {
        subscriberCount: parseInt(channelData?.statistics.subscriberCount ?? '0', 10),
        totalViews: parseInt(channelData?.statistics.viewCount ?? '0', 10),
        videoCount: parseInt(channelData?.statistics.videoCount ?? '0', 10),
      };
    } catch (error) {
      this.logger.error(`getChannelStats 실패: ${channelId}`, error);
      return { subscriberCount: 0, totalViews: 0, videoCount: 0 };
    }
  }

  /**
   * 영상 댓글 수집 (인트로 소재 분석용)
   */
  async getVideoComments(videoId: string, maxResults = 100): Promise<CommentItem[]> {
    if (this.isMockMode) {
      return [
        {
          author: 'MOCK 유저',
          text: '정말 유익한 영상이에요! 덕분에 직접 교체했어요.',
          likeCount: 50,
          publishedAt: '2024-01-01T00:00:00Z',
        },
      ];
    }

    try {
      const commentResData = await this.youtubeGet('commentThreads', {
        videoId,
        part: 'snippet',
        maxResults,
        order: 'relevance', // 인기 댓글 우선
      });

      return (
        commentResData.items?.map(
          (item: {
            snippet: {
              topLevelComment: {
                snippet: {
                  authorDisplayName: string;
                  textDisplay: string;
                  likeCount: number;
                  publishedAt: string;
                };
              };
            };
          }) => ({
            author: item.snippet.topLevelComment.snippet.authorDisplayName,
            text: item.snippet.topLevelComment.snippet.textDisplay,
            likeCount: item.snippet.topLevelComment.snippet.likeCount,
            publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
          }),
        ) ?? []
      );
    } catch (error) {
      this.logger.error(`getVideoComments 실패: ${videoId}`, error);
      return [];
    }
  }

  /**
   * URL에서 채널 ID 추출 + 상세정보 조회
   */
  async getChannelInfo(channelUrl: string): Promise<ChannelInfo> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return {
        channelId: 'mock_channel_id',
        channelName: '[MOCK] 꿈꾸는정비사',
        thumbnailUrl: 'https://via.placeholder.com/88x88',
        subscriberCount: 52000,
        videoCount: 120,
        description: 'MOCK 채널 설명',
      };
    }

    try {
      // @핸들 또는 /channel/UCxxxx 패턴 추출
      let resolvedChannelId: string | null = null;

      // URL 디코딩 (한글 핸들 지원)
      const decodedUrl = decodeURIComponent(channelUrl);
      const channelIdMatch = decodedUrl.match(/\/channel\/(UC[\w-]+)/);
      const handleMatch = decodedUrl.match(/\/@([^/?\s]+)/);

      if (channelIdMatch) {
        resolvedChannelId = channelIdMatch[1];
      } else if (handleMatch) {
        // 핸들로 채널 검색
        const handleSearchData = await this.youtubeGet('search', {
          q: `@${handleMatch[1]}`,
          type: 'channel',
          maxResults: 1,
          part: 'id',
        });
        resolvedChannelId = (handleSearchData.items?.[0] as { id?: { channelId?: string } } | undefined)?.id?.channelId ?? null;
      }

      if (!resolvedChannelId) {
        throw new Error(`채널 ID를 추출할 수 없습니다: ${channelUrl}`);
      }

      const channelDetailData = await this.youtubeGet('channels', {
        id: resolvedChannelId,
        part: 'snippet,statistics',
      });

      const data = channelDetailData.items?.[0] as
        | {
            id: string;
            snippet: {
              title: string;
              description: string;
              thumbnails: { default: { url: string } };
            };
            statistics: { subscriberCount?: string; videoCount?: string };
          }
        | undefined;

      if (!data) {
        throw new Error(`채널을 찾을 수 없습니다: ${resolvedChannelId}`);
      }

      return {
        channelId: data.id,
        channelName: data.snippet.title,
        thumbnailUrl: data.snippet.thumbnails.default.url,
        subscriberCount: parseInt(data.statistics.subscriberCount ?? '0', 10),
        videoCount: parseInt(data.statistics.videoCount ?? '0', 10),
        description: data.snippet.description,
      };
    } catch (error) {
      this.logger.error(`getChannelInfo 실패: ${channelUrl}`, error);
      throw error;
    }
  }

  /**
   * 채널의 영상 목록 + 통계 (조회수 내림차순)
   */
  async getChannelVideos(channelId: string, maxResults = 50, videoDuration?: 'short' | 'medium' | 'long'): Promise<ChannelVideoItem[]> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return [
        {
          videoId: 'mock_v1',
          title: '[MOCK] 채널 영상 1',
          thumbnailUrl: 'https://via.placeholder.com/320x180',
          viewCount: 150000,
          likeCount: 6000,
          publishedAt: '2024-01-01T00:00:00Z',
        },
      ];
    }

    try {
      // 1단계: 채널 영상 검색 (조회수 순)
      const searchParams: Record<string, any> = {
        channelId,
        part: 'id,snippet',
        order: 'viewCount',
        maxResults,
        type: 'video',
      };
      if (videoDuration) {
        searchParams.videoDuration = videoDuration;
      }
      const channelSearchData = await this.youtubeGet('search', searchParams);

      const items = channelSearchData.items as Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          thumbnails: { medium: { url: string } };
          publishedAt: string;
        };
      }>;

      if (!items?.length) return [];

      const videoIds = items.map((item) => item.id.videoId).join(',');

      // 2단계: 통계 조회
      const channelVideoStatsData = await this.youtubeGet('videos', {
        id: videoIds,
        part: 'statistics',
      });

      const statsMap = new Map<string, { viewCount: number; likeCount: number }>();
      for (const v of channelVideoStatsData.items as Array<{
        id: string;
        statistics: { viewCount?: string; likeCount?: string };
      }>) {
        statsMap.set(v.id, {
          viewCount: parseInt(v.statistics.viewCount ?? '0', 10),
          likeCount: parseInt(v.statistics.likeCount ?? '0', 10),
        });
      }

      return items.map((item) => {
        const stats = statsMap.get(item.id.videoId);
        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          viewCount: stats?.viewCount ?? 0,
          likeCount: stats?.likeCount ?? 0,
          publishedAt: item.snippet.publishedAt,
        };
      });
    } catch (error) {
      this.logger.error(`getChannelVideos 실패: ${channelId}`, error);
      throw error;
    }
  }

  /**
   * 인기 급상승 영상 조회
   */
  async getTrendingVideos(regionCode = 'KR', maxResults = 50): Promise<TrendingVideoItem[]> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return [
        {
          videoId: 'mock_trend_1',
          title: '[MOCK] 급상승 영상',
          channelName: 'MOCK 채널',
          channelId: 'mock_ch_1',
          thumbnailUrl: 'https://via.placeholder.com/320x180',
          viewCount: 500000,
          subscriberCount: 100000,
          viewSubRatio: this.calculateViewSubRatio(500000, 100000),
          publishedAt: '2024-01-01T00:00:00Z',
        },
      ];
    }

    try {
      // 1단계: 인기 급상승 영상 조회
      const trendingData = await this.youtubeGet('videos', {
        chart: 'mostPopular',
        regionCode,
        maxResults,
        part: 'snippet,statistics',
      });

      const items = trendingData.items as Array<{
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          channelId: string;
          thumbnails: { medium: { url: string } };
          publishedAt: string;
        };
        statistics: { viewCount?: string };
      }>;

      if (!items?.length) return [];

      // 2단계: 고유 채널 ID 수집 후 구독자 수 배치 조회
      const channelIds = [...new Set(items.map((v) => v.snippet.channelId))];
      const channelSubMap = new Map<string, number>();

      // channels.list는 한 번에 최대 50개 조회 가능
      for (let i = 0; i < channelIds.length; i += 50) {
        const batch = channelIds.slice(i, i + 50).join(',');
        const trendingChannelData = await this.youtubeGet('channels', {
          id: batch,
          part: 'statistics',
        });
        for (const ch of trendingChannelData.items as Array<{
          id: string;
          statistics: { subscriberCount?: string };
        }>) {
          channelSubMap.set(ch.id, parseInt(ch.statistics.subscriberCount ?? '0', 10));
        }
      }

      return items.map((item) => {
        const viewCount = parseInt(item.statistics.viewCount ?? '0', 10);
        const subscriberCount = channelSubMap.get(item.snippet.channelId) ?? 0;
        return {
          videoId: item.id,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          viewCount,
          subscriberCount,
          viewSubRatio: this.calculateViewSubRatio(viewCount, subscriberCount),
          publishedAt: item.snippet.publishedAt,
        };
      });
    } catch (error) {
      this.logger.error(`getTrendingVideos 실패: regionCode=${regionCode}`, error);
      throw error;
    }
  }

  /**
   * 채널 검색 (발굴용)
   */
  async searchChannels(keyword: string, maxResults = 10): Promise<ChannelSearchResult[]> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return [
        {
          channelId: 'mock_search_ch_1',
          channelName: `[MOCK] ${keyword} 관련 채널`,
          thumbnailUrl: 'https://via.placeholder.com/88x88',
          subscriberCount: 30000,
          videoCount: 80,
          description: 'MOCK 채널 설명',
        },
      ];
    }

    try {
      // 1단계: 채널 검색
      const channelSearchResult = await this.youtubeGet('search', {
        q: keyword,
        type: 'channel',
        maxResults,
        part: 'id,snippet',
      });

      const items = channelSearchResult.items as Array<{
        id: { channelId: string };
        snippet: { channelTitle: string };
      }>;

      if (!items?.length) return [];

      const channelIds = items.map((item) => item.id.channelId).join(',');

      // 2단계: 채널 상세 조회
      const channelDetailResult = await this.youtubeGet('channels', {
        id: channelIds,
        part: 'snippet,statistics',
      });

      return (
        channelDetailResult.items?.map(
          (ch: {
            id: string;
            snippet: {
              title: string;
              description: string;
              thumbnails: { default: { url: string } };
            };
            statistics: { subscriberCount?: string; videoCount?: string };
          }) => ({
            channelId: ch.id,
            channelName: ch.snippet.title,
            thumbnailUrl: ch.snippet.thumbnails.default.url,
            subscriberCount: parseInt(ch.statistics.subscriberCount ?? '0', 10),
            videoCount: parseInt(ch.statistics.videoCount ?? '0', 10),
            description: ch.snippet.description,
          }),
        ) ?? []
      );
    } catch (error) {
      this.logger.error(`searchChannels 실패: ${keyword}`, error);
      throw error;
    }
  }

  /**
   * 조회수/구독자 비율 계산 (핵심 KPI)
   * 1.0 = 구독자만큼 조회, 2.0 = 구독자 2배 조회
   */
  calculateViewSubRatio(viewCount: number, subscriberCount: number): number {
    if (subscriberCount === 0) return 0;
    return Math.round((viewCount / subscriberCount) * 100) / 100;
  }

  /**
   * 기여도: 이 영상의 조회수가 채널 평균 대비 얼마나 높은가
   * 5.0+ = Great, 2.0+ = Good, 0.5+ = Normal, 0.2+ = Bad, 미만 = Worst
   */
  calculateContributionScore(
    videoViewCount: number,
    channelTotalViews: number,
    channelVideoCount: number,
  ): { score: number; tier: string } {
    if (channelVideoCount === 0 || channelTotalViews === 0) return { score: 0, tier: 'Normal' };
    const channelAvg = channelTotalViews / channelVideoCount;
    const score = videoViewCount / channelAvg;
    const tier =
      score >= 5 ? 'Great' :
      score >= 2 ? 'Good' :
      score >= 0.5 ? 'Normal' :
      score >= 0.2 ? 'Bad' : 'Worst';
    return { score: Math.round(score * 100) / 100, tier };
  }

  /**
   * 성과도: 구독자 규모별 보정된 조회수/구독자 비율
   * 소형(<1만): 10+ Great / 중형(<10만): 5+ Great / 대형(10만+): 3+ Great
   */
  calculatePerformanceScore(
    viewCount: number,
    subscriberCount: number,
  ): { ratio: number; tier: string } {
    if (subscriberCount === 0) return { ratio: 0, tier: 'Normal' };
    const ratio = viewCount / subscriberCount;
    let tier: string;
    if (subscriberCount < 10000) {
      tier =
        ratio >= 10 ? 'Great' :
        ratio >= 3 ? 'Good' :
        ratio >= 1 ? 'Normal' :
        ratio >= 0.3 ? 'Bad' : 'Worst';
    } else if (subscriberCount < 100000) {
      tier =
        ratio >= 5 ? 'Great' :
        ratio >= 2 ? 'Good' :
        ratio >= 0.5 ? 'Normal' :
        ratio >= 0.1 ? 'Bad' : 'Worst';
    } else {
      tier =
        ratio >= 3 ? 'Great' :
        ratio >= 1 ? 'Good' :
        ratio >= 0.3 ? 'Normal' :
        ratio >= 0.05 ? 'Bad' : 'Worst';
    }
    return { ratio: Math.round(ratio * 100) / 100, tier };
  }

  /**
   * 조회 속도: 일평균 조회수 (최소 1일 기준)
   */
  calculateViewVelocity(
    viewCount: number,
    publishedAt: string,
  ): { velocity: number; daysSince: number } {
    const days = Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000));
    return { velocity: Math.round(viewCount / days), daysSince: days };
  }

  /**
   * 참여율: (좋아요 + 댓글) / 조회수 × 100
   * 10%+ = Great, 5%+ = Good, 2%+ = Normal, 0.5%+ = Bad, 미만 = Worst
   */
  calculateEngagementRate(
    likeCount: number,
    commentCount: number,
    viewCount: number,
  ): { rate: number; tier: string } {
    if (viewCount === 0) return { rate: 0, tier: 'Normal' };
    const rate = ((likeCount + commentCount) / viewCount) * 100;
    const tier =
      rate >= 10 ? 'Great' :
      rate >= 5 ? 'Good' :
      rate >= 2 ? 'Normal' :
      rate >= 0.5 ? 'Bad' : 'Worst';
    return { rate: Math.round(rate * 100) / 100, tier };
  }
}
