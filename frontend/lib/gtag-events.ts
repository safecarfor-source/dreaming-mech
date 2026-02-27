/**
 * Google Analytics 4 커스텀 이벤트 추적 라이브러리
 *
 * GA4 표준 이벤트명 활용 (generate_lead, sign_up, view_item 등)
 * → GA4 콘솔에서 자동 인식 + 전환 설정 가능
 *
 * 사용법: import { gtagEvent } from '@/lib/gtag-events';
 *         gtagEvent.inquiryStepComplete(2, '서울 강남구', 'TIRE');
 */

// GA gtag 함수 안전 호출
function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// ═══════════════════════════════════════
// 1. 문의 퍼널 이벤트 (최우선)
// ═══════════════════════════════════════

/** 문의 폼 스텝 완료 */
function inquiryStepComplete(step: number, region?: string, serviceType?: string) {
  gtag('event', 'inquiry_step_complete', {
    step_number: step,
    region: region || '',
    service_type: serviceType || '',
  });
}

/** 문의 접수 완료 (전환 이벤트) — GA4 generate_lead */
function inquirySubmit(params: {
  serviceType: string;
  region: string;
  hasTrackingCode: boolean;
  hasMechanicId: boolean;
}) {
  gtag('event', 'generate_lead', {
    value: 1,
    currency: 'KRW',
    service_type: params.serviceType,
    region: params.region,
    has_tracking_code: params.hasTrackingCode,
    has_mechanic_id: params.hasMechanicId,
  });
}

/** 문의 폼 이탈 (스텝 중간에 페이지 떠남) */
function inquiryAbandon(step: number, region?: string) {
  gtag('event', 'inquiry_abandon', {
    step_number: step,
    region: region || '',
  });
}

// ═══════════════════════════════════════
// 2. 정비사 관련 이벤트
// ═══════════════════════════════════════

/** 정비사 카드 클릭 (목록에서) — GA4 select_item */
function mechanicCardClick(mechanicId: number, mechanicName: string, region: string) {
  gtag('event', 'select_item', {
    items: [{
      item_id: String(mechanicId),
      item_name: mechanicName,
      item_category: region,
    }],
  });
}

/** 정비사 상세 모달 오픈 — GA4 view_item */
function mechanicDetailView(mechanicId: number, mechanicName: string, region: string) {
  gtag('event', 'view_item', {
    items: [{
      item_id: String(mechanicId),
      item_name: mechanicName,
      item_category: region,
    }],
  });
}

/** 정비사에게 전화 걸기 */
function mechanicPhoneClick(mechanicId: number, mechanicName: string) {
  gtag('event', 'mechanic_phone_click', {
    mechanic_id: mechanicId,
    mechanic_name: mechanicName,
  });
}

// ═══════════════════════════════════════
// 3. 사장님(Owner) 가입 이벤트
// ═══════════════════════════════════════

/** 카카오 로그인 시작 — GA4 login */
function ownerLoginStart() {
  gtag('event', 'login', {
    method: 'kakao',
    user_type: 'owner',
  });
}

/** 사장님 가입 완료 — GA4 sign_up */
function ownerSignupComplete() {
  gtag('event', 'sign_up', {
    method: 'kakao',
    user_type: 'owner',
  });
}

/** 정비소 등록 완료 */
function mechanicRegistrationComplete(mechanicName: string, region: string) {
  gtag('event', 'mechanic_registration', {
    mechanic_name: mechanicName,
    region: region,
  });
}

// ═══════════════════════════════════════
// 4. 고객 가입 이벤트
// ═══════════════════════════════════════

/** 고객 카카오 로그인/가입 */
function customerLoginStart() {
  gtag('event', 'login', {
    method: 'kakao',
    user_type: 'customer',
  });
}

// ═══════════════════════════════════════
// 5. 커뮤니티 이벤트
// ═══════════════════════════════════════

/** 글 작성 */
function communityPostCreate(category: string) {
  gtag('event', 'community_post_create', {
    category: category,
  });
}

/** 댓글 작성 */
function communityCommentCreate(postId: number) {
  gtag('event', 'community_comment_create', {
    post_id: postId,
  });
}

/** 좋아요 */
function communityLike(contentType: 'post' | 'comment', contentId: number) {
  gtag('event', 'community_like', {
    content_type: contentType,
    content_id: contentId,
  });
}

// ═══════════════════════════════════════
// 6. CTA / 외부 링크 이벤트
// ═══════════════════════════════════════

/** 카카오 오픈채팅 클릭 */
function openChatClick(source: string) {
  gtag('event', 'open_chat_click', {
    source: source,
  });
}

/** 유튜브 채널 링크 클릭 */
function youtubeChannelClick(source: string) {
  gtag('event', 'youtube_channel_click', {
    source: source,
  });
}

/** CTA 버튼 클릭 (일반) */
function ctaClick(ctaName: string, ctaLocation: string) {
  gtag('event', 'cta_click', {
    cta_name: ctaName,
    cta_location: ctaLocation,
  });
}

// ═══════════════════════════════════════
// 7. 검색 이벤트
// ═══════════════════════════════════════

/** 지역 검색 — GA4 search */
function regionSearch(searchTerm: string, resultsCount: number) {
  gtag('event', 'search', {
    search_term: searchTerm,
    search_results_count: resultsCount,
  });
}

// ═══════════════════════════════════════
// 8. 공유 이벤트
// ═══════════════════════════════════════

/** 문의 공유 — GA4 share */
function inquiryShare(method: string, inquiryType: string, inquiryId: number) {
  gtag('event', 'share', {
    method: method,
    content_type: inquiryType,
    item_id: String(inquiryId),
  });
}

// 모든 이벤트 내보내기
export const gtagEvent = {
  // 문의 퍼널
  inquiryStepComplete,
  inquirySubmit,
  inquiryAbandon,
  // 정비사
  mechanicCardClick,
  mechanicDetailView,
  mechanicPhoneClick,
  // 사장님 가입
  ownerLoginStart,
  ownerSignupComplete,
  mechanicRegistrationComplete,
  // 고객 가입
  customerLoginStart,
  // 커뮤니티
  communityPostCreate,
  communityCommentCreate,
  communityLike,
  // CTA / 외부
  openChatClick,
  youtubeChannelClick,
  ctaClick,
  // 검색
  regionSearch,
  // 공유
  inquiryShare,
};
