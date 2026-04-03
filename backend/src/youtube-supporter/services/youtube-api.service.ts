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

  private get apiKey(): string | undefined {
    return process.env.YOUTUBE_API_KEY;
  }

  private get isMockMode(): boolean {
    return !this.apiKey;
  }

  /**
   * 키워드로 YouTube 영상 검색
   */
  async searchVideos(
    keyword: string,
    language: 'ko' | 'en' = 'ko',
    maxResults = 10,
  ): Promise<YouTubeVideoItem[]> {
    if (this.isMockMode) {
      this.logger.warn('YOUTUBE_API_KEY 미설정 — mock 데이터 반환');
      return MOCK_VIDEOS;
    }

    try {
      // 1단계: 영상 검색
      const searchRes = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: keyword,
          part: 'snippet',
          type: 'video',
          maxResults,
          relevanceLanguage: language,
          videoCaption: 'closedCaption', // 자막 있는 영상만
        },
      });

      const items = searchRes.data.items as Array<{
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
      const statsRes = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds,
          part: 'statistics',
        },
      });

      const statsMap = new Map<string, { viewCount: number; likeCount: number; commentCount: number }>();
      for (const v of statsRes.data.items as Array<{
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
      const videoRes = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'snippet,statistics',
        },
      });

      const videoData = videoRes.data.items?.[0] as
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
   * 채널 구독자 수 조회
   */
  async getChannelStats(channelId: string): Promise<{ subscriberCount: number }> {
    if (this.isMockMode) {
      return { subscriberCount: 52000 };
    }

    try {
      const res = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: channelId,
          part: 'statistics',
        },
      });

      const channelData = res.data.items?.[0] as
        | { statistics: { subscriberCount?: string } }
        | undefined;

      return {
        subscriberCount: parseInt(channelData?.statistics.subscriberCount ?? '0', 10),
      };
    } catch (error) {
      this.logger.error(`getChannelStats 실패: ${channelId}`, error);
      return { subscriberCount: 0 };
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
      const res = await axios.get(`${this.baseUrl}/commentThreads`, {
        params: {
          key: this.apiKey,
          videoId,
          part: 'snippet',
          maxResults,
          order: 'relevance', // 인기 댓글 우선
        },
      });

      return (
        res.data.items?.map(
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
   * 조회수/구독자 비율 계산 (핵심 KPI)
   * 1.0 = 구독자만큼 조회, 2.0 = 구독자 2배 조회
   */
  calculateViewSubRatio(viewCount: number, subscriberCount: number): number {
    if (subscriberCount === 0) return 0;
    return Math.round((viewCount / subscriberCount) * 100) / 100;
  }
}
