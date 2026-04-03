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

      const channelIdMatch = channelUrl.match(/\/channel\/(UC[\w-]+)/);
      const handleMatch = channelUrl.match(/\/@([\w.-]+)/);

      if (channelIdMatch) {
        resolvedChannelId = channelIdMatch[1];
      } else if (handleMatch) {
        // 핸들로 채널 검색
        const searchRes = await axios.get(`${this.baseUrl}/search`, {
          params: {
            key: this.apiKey,
            q: `@${handleMatch[1]}`,
            type: 'channel',
            maxResults: 1,
            part: 'id',
          },
        });
        resolvedChannelId = (searchRes.data.items?.[0] as { id?: { channelId?: string } } | undefined)?.id?.channelId ?? null;
      }

      if (!resolvedChannelId) {
        throw new Error(`채널 ID를 추출할 수 없습니다: ${channelUrl}`);
      }

      const res = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: resolvedChannelId,
          part: 'snippet,statistics',
        },
      });

      const data = res.data.items?.[0] as
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
  async getChannelVideos(channelId: string, maxResults = 50): Promise<ChannelVideoItem[]> {
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
      const searchRes = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          channelId,
          part: 'id,snippet',
          order: 'viewCount',
          maxResults,
          type: 'video',
        },
      });

      const items = searchRes.data.items as Array<{
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
      const statsRes = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds,
          part: 'statistics',
        },
      });

      const statsMap = new Map<string, { viewCount: number; likeCount: number }>();
      for (const v of statsRes.data.items as Array<{
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
      const videosRes = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          chart: 'mostPopular',
          regionCode,
          maxResults,
          part: 'snippet,statistics',
        },
      });

      const items = videosRes.data.items as Array<{
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
        const chRes = await axios.get(`${this.baseUrl}/channels`, {
          params: {
            key: this.apiKey,
            id: batch,
            part: 'statistics',
          },
        });
        for (const ch of chRes.data.items as Array<{
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
      const searchRes = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: keyword,
          type: 'channel',
          maxResults,
          part: 'id,snippet',
        },
      });

      const items = searchRes.data.items as Array<{
        id: { channelId: string };
        snippet: { channelTitle: string };
      }>;

      if (!items?.length) return [];

      const channelIds = items.map((item) => item.id.channelId).join(',');

      // 2단계: 채널 상세 조회
      const detailRes = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: channelIds,
          part: 'snippet,statistics',
        },
      });

      return (
        detailRes.data.items?.map(
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
}
