'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageSquare, Users, ChevronRight, LogOut, MapPin, FileText } from 'lucide-react';
import { useUserStore } from '@/lib/auth';
import { serviceInquiryApi, communityApi } from '@/lib/api';

// localStorage에서 찜한 정비소 목록 읽기
interface FavoriteShop {
  id: number;
  name: string;
  address: string;
  slug: string;
}

function getFavorites(): FavoriteShop[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('favorite_shops');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function removeFavorite(id: number) {
  const list = getFavorites().filter((s) => s.id !== id);
  localStorage.setItem('favorite_shops', JSON.stringify(list));
}

interface ServiceInquiry {
  id: number;
  serviceType: string;
  regionSido: string;
  regionSigungu: string;
  status: string;
  createdAt: string;
}

interface MyPost {
  id: number;
  title: string;
  category: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface MyComment {
  id: number;
  content: string;
  createdAt: string;
  post: { id: number; title: string };
}

type CommunityItem =
  | { kind: 'post'; data: MyPost }
  | { kind: 'comment'; data: MyComment };

const STATUS_LABEL: Record<string, string> = {
  PENDING: '접수 완료',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50',
  IN_PROGRESS: 'text-blue-600 bg-blue-50',
  COMPLETED: 'text-green-600 bg-green-50',
  CANCELLED: 'text-gray-400 bg-gray-50',
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  TIRE: '타이어',
  OIL: '엔진오일',
  BRAKE: '브레이크',
  MAINTENANCE: '경정비',
  CONSULT: '종합상담',
};

const PREVIEW_COUNT = 3;

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useUserStore();
  const [favorites, setFavorites] = useState<FavoriteShop[]>([]);
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  // 비로그인 시 /login 리다이렉트
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // 찜 목록 불러오기
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // 내 문의 내역 불러오기
  useEffect(() => {
    if (!isAuthenticated) return;
    setInquiryLoading(true);
    serviceInquiryApi
      .getAll(1, 20)
      .then((res) => {
        setInquiries(res.data.data ?? []);
      })
      .catch(() => {
        // 조회 실패 시 빈 배열 유지
      })
      .finally(() => {
        setInquiryLoading(false);
      });
  }, [isAuthenticated]);

  // 내 커뮤니티 활동 불러오기
  useEffect(() => {
    if (!isAuthenticated) return;
    setCommunityLoading(true);
    communityApi
      .getMyActivity(20)
      .then((res) => {
        const posts: CommunityItem[] = (res.data.posts ?? []).map((p) => ({
          kind: 'post' as const,
          data: p,
        }));
        const comments: CommunityItem[] = (res.data.comments ?? []).map((c) => ({
          kind: 'comment' as const,
          data: c,
        }));
        // 최신순으로 합치기
        const merged = [...posts, ...comments].sort(
          (a, b) =>
            new Date(b.kind === 'post' ? b.data.createdAt : b.data.createdAt).getTime() -
            new Date(a.kind === 'post' ? a.data.createdAt : a.data.createdAt).getTime()
        );
        setCommunityItems(merged);
      })
      .catch(() => {
        // 조회 실패 시 빈 배열 유지
      })
      .finally(() => {
        setCommunityLoading(false);
      });
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRemoveFavorite = (id: number) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  };

  if (!isAuthenticated) return null;

  const displayName = user?.nickname || user?.name || '회원';
  const profileImage = user?.profileImage;

  const displayFavorites = favorites.slice(0, PREVIEW_COUNT);
  const displayInquiries = inquiries.slice(0, PREVIEW_COUNT);
  const displayCommunity = communityItems.slice(0, PREVIEW_COUNT);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* 상단 프로필 카드 */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-xl mx-auto px-5 py-8">
          <div className="flex items-center gap-4">
            {/* 프로필 이미지 */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#FFF0F5] flex items-center justify-center flex-shrink-0 border-2 border-[#E4015C]/20">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>

            {/* 이름 + 이메일 */}
            <div className="flex-1 min-w-0">
              <p className="text-[20px] font-bold text-[#111827] leading-tight truncate">
                {displayName}
              </p>
              {user?.email && (
                <p className="text-sm text-[#6B7280] mt-0.5 truncate">{user.email}</p>
              )}
              <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#FFF0F5] text-[#E4015C] text-xs font-semibold rounded-full">
                일반 회원
              </span>
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#6B7280] hover:text-[#E4015C] hover:bg-[#FFF0F5] transition-colors rounded-lg flex-shrink-0"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-6">

        {/* 찜한 정비소 섹션 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={18} className="text-[#E4015C]" />
            <h2 className="text-[17px] font-bold text-[#111827]">찜한 정비소</h2>
            <span className="ml-auto text-sm text-[#9CA3AF]">{favorites.length}개</span>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-8 text-center">
              <Heart size={32} className="text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[15px] text-[#9CA3AF]">
                아직 찜한 정비소가 없습니다
              </p>
              <Link
                href="/#shops"
                className="inline-block mt-3 text-sm text-[#E4015C] font-semibold hover:underline"
              >
                정비소 둘러보기
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {displayFavorites.map((shop) => (
                  <li
                    key={shop.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#111827] truncate">{shop.name}</p>
                      <p className="flex items-center gap-1 text-[13px] text-[#6B7280] mt-0.5">
                        <MapPin size={12} className="text-[#E4015C] flex-shrink-0" />
                        <span className="truncate">{shop.address}</span>
                      </p>
                    </div>
                    <Link
                      href={`/shop/${shop.slug}`}
                      className="flex items-center gap-1 text-sm text-[#E4015C] font-semibold flex-shrink-0"
                    >
                      보기 <ChevronRight size={16} />
                    </Link>
                    <button
                      onClick={() => handleRemoveFavorite(shop.id)}
                      className="text-[#9CA3AF] hover:text-[#E4015C] transition-colors flex-shrink-0"
                      aria-label="찜 해제"
                    >
                      <Heart size={18} fill="currentColor" />
                    </button>
                  </li>
                ))}
              </ul>
              {favorites.length > PREVIEW_COUNT && (
                <Link
                  href="/mypage/favorites"
                  className="flex items-center justify-center gap-1 mt-2 py-3 text-sm text-[#E4015C] font-semibold hover:underline"
                >
                  전체 {favorites.length}개 보기 <ChevronRight size={16} />
                </Link>
              )}
            </>
          )}
        </section>

        {/* 내 문의 내역 섹션 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={18} className="text-[#E4015C]" />
            <h2 className="text-[17px] font-bold text-[#111827]">내 문의 내역</h2>
            {inquiries.length > 0 && (
              <span className="ml-auto text-sm text-[#9CA3AF]">{inquiries.length}건</span>
            )}
          </div>

          {inquiryLoading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-8 text-center">
              <div className="w-8 h-8 border-2 border-[#E4015C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#9CA3AF]">불러오는 중...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-8 text-center">
              <MessageSquare size={32} className="text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[15px] text-[#9CA3AF]">아직 문의 내역이 없습니다</p>
              <Link
                href="/inquiry"
                className="inline-block mt-3 text-sm text-[#E4015C] font-semibold hover:underline"
              >
                정비 문의하기
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {displayInquiries.map((inq) => (
                  <li
                    key={inq.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#111827]">
                          {SERVICE_TYPE_LABEL[inq.serviceType] ?? inq.serviceType}
                        </p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">
                          {inq.regionSido} {inq.regionSigungu}
                        </p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1">
                          {new Date(inq.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[12px] font-semibold ${STATUS_COLOR[inq.status] ?? 'text-gray-500 bg-gray-50'}`}>
                        {STATUS_LABEL[inq.status] ?? inq.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {inquiries.length > PREVIEW_COUNT && (
                <Link
                  href="/mypage/inquiries"
                  className="flex items-center justify-center gap-1 mt-2 py-3 text-sm text-[#E4015C] font-semibold hover:underline"
                >
                  전체 {inquiries.length}건 보기 <ChevronRight size={16} />
                </Link>
              )}
            </>
          )}
        </section>

        {/* 커뮤니티 내 활동 섹션 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-[#E4015C]" />
            <h2 className="text-[17px] font-bold text-[#111827]">내 커뮤니티 활동</h2>
            {communityItems.length > 0 && (
              <span className="ml-auto text-sm text-[#9CA3AF]">{communityItems.length}개</span>
            )}
          </div>

          {communityLoading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-8 text-center">
              <div className="w-8 h-8 border-2 border-[#E4015C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-[#9CA3AF]">불러오는 중...</p>
            </div>
          ) : communityItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-8 text-center">
              <Users size={32} className="text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[15px] text-[#9CA3AF]">아직 작성한 글/댓글이 없습니다</p>
              <Link
                href="/community"
                className="inline-block mt-3 text-sm text-[#E4015C] font-semibold hover:underline"
              >
                커뮤니티 가기
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {displayCommunity.map((item, idx) => {
                  if (item.kind === 'post') {
                    const p = item.data;
                    return (
                      <li key={`post-${p.id}-${idx}`} className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4">
                        <Link href={`/community/${p.id}`} className="block group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] px-2 py-0.5 bg-[#FFF0F5] text-[#E4015C] rounded-full font-semibold">글</span>
                                <span className="text-[11px] text-[#9CA3AF]">{p.category}</span>
                              </div>
                              <p className="text-[15px] font-semibold text-[#111827] truncate group-hover:text-[#E4015C] transition-colors">
                                {p.title}
                              </p>
                              <p className="text-[12px] text-[#9CA3AF] mt-1">
                                {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                                &nbsp;·&nbsp;조회 {p.viewCount}&nbsp;·&nbsp;좋아요 {p.likeCount}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0 mt-1" />
                          </div>
                        </Link>
                      </li>
                    );
                  } else {
                    const c = item.data;
                    return (
                      <li key={`comment-${c.id}-${idx}`} className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4">
                        <Link href={`/community/${c.post.id}`} className="block group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-[#6B7280] rounded-full font-semibold">댓글</span>
                                <span className="text-[11px] text-[#9CA3AF] truncate">{c.post.title}</span>
                              </div>
                              <p className="text-[14px] text-[#374151] truncate group-hover:text-[#E4015C] transition-colors">
                                {c.content}
                              </p>
                              <p className="text-[12px] text-[#9CA3AF] mt-1">
                                {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0 mt-1" />
                          </div>
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
              {communityItems.length > PREVIEW_COUNT && (
                <Link
                  href="/community"
                  className="flex items-center justify-center gap-1 mt-2 py-3 text-sm text-[#E4015C] font-semibold hover:underline"
                >
                  커뮤니티 전체 보기 <ChevronRight size={16} />
                </Link>
              )}
            </>
          )}
        </section>

        {/* 문의하기 퀵 링크 */}
        <section className="pb-8">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#E4015C]" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111827]">정비 문의하기</p>
                  <p className="text-[12px] text-[#9CA3AF]">가까운 정비소에 견적을 받아보세요</p>
                </div>
              </div>
              <Link
                href="/inquiry"
                className="flex items-center gap-1 text-sm text-[#E4015C] font-semibold"
              >
                바로가기 <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
