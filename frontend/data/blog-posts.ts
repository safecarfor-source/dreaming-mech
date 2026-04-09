/**
 * 블로그 콘텐츠 데이터
 * 유튜브 대본 → 글 콘텐츠 재활용
 * 마크다운 스타일 텍스트 (줄바꿈 = \n)
 */

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  publishedAt: string; // ISO 날짜
  category: string;
  readTime: number; // 분
  youtubeVideoId: string; // 관련 유튜브 영상 ID
  seoTitle: string;
  seoDescription: string;
  ogImage: string; // OG 이미지 URL (없으면 기본 이미지)
  relatedServices: string[]; // 관련 서비스 키워드
  relatedServiceSlugs: string[]; // 서비스×지역 페이지 slug
  content: string; // 본문 (마크다운 스타일)
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: '10만km-디젤-관리법',
    title: '10만km 디젤, 버려야 할까?',
    subtitle: '딱 두 가지만 하면 돈 아끼면서 더 탄다',
    publishedAt: '2026-04-09',
    category: '정비 가이드',
    readTime: 5,
    youtubeVideoId: '', // TODO: 실제 영상 ID
    seoTitle: '10만km 디젤 관리법 | 연료필터 + 미션오일 | 꿈꾸는 정비사',
    seoDescription: '10만km 디젤차, 버려야 할까? 연료필터와 미션오일 딱 두 가지만 관리하면 20만km까지 탈 수 있습니다. 20년 경력 정비사의 실전 조언.',
    ogImage: '',
    relatedServices: ['연료필터', '미션오일'],
    relatedServiceSlugs: ['fuel-filter-incheon', 'transmission-oil-incheon'],
    content: `10만 킬로. 이 숫자만 보면 "이제 차 바꿔야 하나?" 생각이 드시죠.

결론부터 말할게요. 안 바꿔도 됩니다. 딱 두 가지만 하면요.

## 첫 번째: 연료필터

디젤차에서 연료필터는 콩팥이에요. 피를 걸러주는 콩팥이 막히면 사람이 어떻게 되는지 아시잖아요. 차도 똑같아요.

연료필터가 막히면 이런 순서로 증상이 와요:

1단계 — 출력이 예전 같지 않다. 오르막에서 힘이 빠진다.
2단계 — 가속이 뚝뚝 끊긴다. RPM은 올라가는데 속도가 안 붙는다.
3단계 — 시동이 꺼진다. 고속도로 한복판에서.

3단계까지 가면 견인비에 인젝터 수리비까지. 최소 50만 원이에요.

그런데 연료필터 교체 비용? 5~10만 원.

제조사에서는 6만km마다 교환하라고 하지만, 솔직히 국내 경유 품질을 생각하면 4만km에 한 번이 안전해요. 저는 20년간 수천 대를 봤는데, 6만km까지 버틴 필터 중에 깨끗한 걸 본 적이 없어요.

## 두 번째: 미션오일

삼겹살 구워보셨죠? 기름이 식으면 하얗게 굳잖아요. 미션오일도 마찬가지예요. 시간이 지나면 파라핀처럼 굳어서 변속이 뻑뻑해집니다.

"제조사에서 무교환이라고 했는데요?"

그건 이상적인 조건 기준이에요. 독일 아우토반처럼 100km/h로 쭉 달리는 환경이요. 한국 도로는요? 신호 대기, 급가속, 급정지. 이게 가혹 조건이에요.

변속 충격이 느껴지거나 기어 넣을 때 뻑뻑한 느낌이 든다? 이미 미션오일이 탁해진 거예요.

미션오일 교환비: 8~15만 원
변속기 교체비: 300만 원 이상

어떤 게 이득인지, 답은 정해져 있잖아요.

## 그래서 결론

10만km 디젤차, 버리지 마세요.

연료필터 한 번, 미션오일 한 번. 합쳐서 20만 원이면 차가 다시 살아나요.

이 두 가지만 제때 해주면 20만km까지 무리 없이 탈 수 있어요. 제가 20년간 봐온 패턴이에요.

"조금만 더 타자" 하다가 큰돈 쓰는 분들을 너무 많이 봤습니다. 소모품은 제때 바꾸는 게 진짜 절약이에요.`,
  },
];

export function findBlogPost(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
