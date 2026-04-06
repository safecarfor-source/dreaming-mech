import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ytApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 인증 토큰 자동 포함
ytApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('yt_auth_token');
    if (token) {
      config.headers['x-yt-token'] = token;
    }
  }
  return config;
});

// 응답 인터셉터: { success, data } 형태 → data만 추출
ytApi.interceptors.response.use((response) => {
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    response.data = response.data.data;
  }
  return response;
});

// 타입 정의
export interface YtReferenceVideo {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  viewCount: number;
  subscriberCount: number;
  thumbnailUrl?: string;
  viewSubRatio: number;
}

export interface YtProject {
  id: string;
  title: string;
  shootingDate?: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  referenceVideos?: YtReferenceVideo[];
}

export interface YtSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  viewCount: number;
  subscriberCount: number;
  ratio?: number;
}

export interface YtProductionResult {
  version: 1 | 2;
  research: string;
  introMaterial: string;
  coreValue: string;
  script: string;
  thumbnailText: string;
  titleSuggestions: string[];
  hashtags: string[];
  description: string;
}

export interface YtSkill {
  id: string;
  title: string;
  content: string;
  preview: string;
  category: string;
  source: string;
  createdAt: string;
}

// 인증
export const authYt = async (password: string): Promise<{ token: string }> => {
  const res = await ytApi.post('/yt/auth', { password });
  return res.data;
};

// 프로젝트
export const getProjects = async (): Promise<YtProject[]> => {
  const res = await ytApi.get('/yt/projects');
  return res.data;
};

export const createProject = async (data: {
  title: string;
  shootingDate?: string;
}): Promise<YtProject> => {
  const res = await ytApi.post('/yt/projects', data);
  return res.data;
};

export const getProject = async (id: string): Promise<YtProject> => {
  const res = await ytApi.get(`/yt/projects/${id}`);
  return res.data;
};

export const updateProject = async (
  id: string,
  data: Partial<YtProject>
): Promise<YtProject> => {
  const res = await ytApi.patch(`/yt/projects/${id}`, data);
  return res.data;
};

export const completeProject = async (id: string): Promise<YtProject> => {
  const res = await ytApi.patch(`/yt/projects/${id}/complete`);
  return res.data;
};

export const reopenProject = async (id: string): Promise<YtProject> => {
  const res = await ytApi.patch(`/yt/projects/${id}/reopen`);
  return res.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await ytApi.delete(`/yt/projects/${id}`);
};

// 검색
export const searchVideos = async (
  keyword: string
): Promise<YtSearchResult[]> => {
  const res = await ytApi.post('/yt/search', { keyword });
  return res.data;
};

// 제작 분석
export const startProduction = async (
  projectId: string,
  videoIds: string[]
): Promise<{ jobId: string }> => {
  const res = await ytApi.post(`/yt/projects/${projectId}/produce`, {
    referenceVideoIds: videoIds,
  });
  return res.data;
};

export interface ProductionStatusResponse {
  data: any[];
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  elapsed?: number;
  message?: string;
  error?: string;
}

export const getProductionResult = async (
  projectId: string
): Promise<ProductionStatusResponse> => {
  // 인터셉터가 .data를 추출하므로, 직접 fetch로 원본 응답을 받음
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/projects/${projectId}/production`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
  });
  return res.json();
};

// 대본 대화형 수정
export const refineScript = async (
  projectId: string,
  message: string,
  version?: number,
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ response: string }> => {
  const res = await ytApi.post(`/yt/projects/${projectId}/refine`, {
    message,
    version,
    chatHistory,
  });
  return res.data;
};

// 대본 직접 수정 (DB 저장)
export const updateProductionField = async (
  projectId: string,
  version: number,
  field: string,
  value: any,
): Promise<void> => {
  await ytApi.patch(`/yt/projects/${projectId}/production/${version}`, {
    [field]: value,
  });
};

// 숏폼 분석
export interface ShortformSegment {
  id: number;
  startTime: string;
  endTime: string;
  hookTitle: string;
  subTitle: string;
  reason: string;
  hookScore: number;
  storyScore: number;
  viralScore: number;
  segments?: Array<{ start: string; end: string; label: string }>;
}

export const analyzeShortform = async (
  data: { videoUrl?: string; projectId?: string; transcript?: string },
): Promise<{ videoTitle: string; transcriptLength: number; segments: ShortformSegment[] }> => {
  const res = await ytApi.post('/yt/shortform/analyze', data);
  return res.data;
};

export const saveTimeline = async (
  projectId: string,
  timeline: string
): Promise<void> => {
  await ytApi.post(`/yt/projects/${projectId}/timeline`, { timeline });
};

// 학습
export const analyzeLearnContent = async (data: {
  type: 'url' | 'text' | 'file';
  content: string;
  projectId?: string;
}): Promise<{ result: string; skills: YtSkill[] }> => {
  const res = await ytApi.post('/yt/learn', data);
  return res.data;
};

// 스킬 노트
export const getSkills = async (category?: string): Promise<YtSkill[]> => {
  const res = await ytApi.get('/yt/skills', {
    params: category ? { category } : undefined,
  });
  return res.data;
};

export const saveSkill = async (
  data: Omit<YtSkill, 'id' | 'createdAt'>
): Promise<YtSkill> => {
  const res = await ytApi.post('/yt/skills', data);
  return res.data;
};

// 채널 관리
export async function getChannels(category?: string) {
  const params = category ? `?category=${category}` : '';
  const res = await ytApi.get(`/yt/channels${params}`);
  return res.data;
}
export async function createChannel(data: { channelUrl: string; category?: string; memo?: string }) {
  const res = await ytApi.post('/yt/channels', data);
  return res.data;
}
export async function updateChannel(id: string, data: { category?: string; memo?: string }) {
  const res = await ytApi.patch(`/yt/channels/${id}`, data);
  return res.data;
}
export async function deleteChannel(id: string) {
  const res = await ytApi.delete(`/yt/channels/${id}`);
  return res.data;
}

// 카테고리
export async function getCategories() {
  const res = await ytApi.get('/yt/categories');
  return res.data;
}
export async function createCategory(name: string) {
  const res = await ytApi.post('/yt/categories', { name });
  return res.data;
}
export async function deleteCategory(id: string) {
  const res = await ytApi.delete(`/yt/categories/${id}`);
  return res.data;
}

// 탐색
export async function discoverChannelVideos(data: { category?: string; limit?: number; videoDuration?: 'short' | 'medium' | 'long' }) {
  const res = await ytApi.post('/yt/discover/channel-videos', data);
  return res.data;
}
export async function discoverByKeyword(data: {
  keyword: string;
  language?: string;
  maxResults?: number;
  videoDuration?: 'short' | 'medium' | 'long';
}) {
  const res = await ytApi.post('/yt/discover/keyword', data);
  return res.data;
}

// 프로젝트에 레퍼런스 영상 추가
export async function addReferencesToProject(
  projectId: string,
  videos: Array<{
    videoId: string;
    title: string;
    channelName: string;
    channelId?: string;
    viewCount?: number;
    subscriberCount?: number;
    thumbnailUrl?: string;
  }>,
) {
  const res = await ytApi.post(`/yt/projects/${projectId}/references`, { videos });
  return res.data;
}
export async function discoverTrending(maxResults?: number) {
  const params = maxResults ? `?maxResults=${maxResults}` : '';
  const res = await ytApi.get(`/yt/discover/trending${params}`);
  return res.data;
}
export async function discoverRecommend() {
  const res = await ytApi.post('/yt/discover/recommend');
  return res.data;
}
export async function discoverFindChannels(keyword: string) {
  const res = await ytApi.post('/yt/discover/find-channels', { keyword });
  return res.data;
}

// 레퍼런스 자동 추천
export async function suggestReferences(projectId: string) {
  const res = await ytApi.post(`/yt/projects/${projectId}/suggest-references`);
  return res.data;
}

// 숏폼 Phase 2: 영상 처리
export interface ShortformJobResult {
  index: number;
  hookTitle: string;
  subTitle: string;
  downloadUrl?: string;
  error?: string;
}

export interface ShortformJobStatus {
  status: 'UPLOADING' | 'TRANSCRIBING' | 'ANALYZING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: string;
  results?: ShortformJobResult[];
  error?: string;
}

export const uploadShortformVideo = async (
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<{ jobId: string }> => {
  const formData = new FormData();
  formData.append('video', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/process`, {
    method: 'POST',
    headers: token ? { 'x-yt-token': token } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || '업로드 실패');
  }
  const data = await res.json();
  return data.data ?? data;
};

export const getShortformJobStatus = async (jobId: string): Promise<ShortformJobStatus> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/job/${jobId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
  });
  if (!res.ok) throw new Error('상태 조회 실패');
  const data = await res.json();
  return data.data ?? data;
};

export const getShortformDownloadUrl = (jobId: string, index: number): string => {
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  // 토큰은 쿼리파라미터로 전달 (다운로드 링크용)
  return `${baseUrl}/yt/shortform/download/${jobId}/${index}${token ? `?token=${token}` : ''}`;
};

// ─── 숏폼 DB 저장/조회 ────────────────────────────────────────

export interface SavedShortformJob {
  id: string;
  projectId: string;
  externalJobId: string;
  status: string;
  fileName?: string;
  results?: ShortformJobResult[];
  error?: string;
  createdAt: string;
}

export const saveShortformJob = async (data: {
  projectId: string;
  externalJobId: string;
  status: string;
  fileName?: string;
  results?: ShortformJobResult[];
  error?: string;
}): Promise<SavedShortformJob> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('저장 실패');
  const json = await res.json();
  return json.data ?? json;
};

export const listShortformJobs = async (projectId: string): Promise<SavedShortformJob[]> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/list/${projectId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
  });
  if (!res.ok) throw new Error('조회 실패');
  const json = await res.json();
  return json.data ?? [];
};

// ─── 숏폼 Storage 관리 ────────────────────────────────────────

export interface StorageJob {
  jobId: string;
  date: string;
  size: string;
  files: { name: string; size: string }[];
  label: string;
}

export const getShortformStorage = async (): Promise<{ data: StorageJob[]; totalSize: string }> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/storage`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
  });
  if (!res.ok) throw new Error('조회 실패');
  return res.json();
};

export const deleteShortformStorage = async (jobId: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('yt_auth_token') : null;
  const baseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
    : 'http://localhost:3001';
  const res = await fetch(`${baseUrl}/yt/shortform/storage/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-yt-token': token } : {}),
    },
  });
  if (!res.ok) throw new Error('삭제 실패');
};

export default ytApi;
