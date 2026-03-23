'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Share2, ChevronLeft, ChevronRight, BadgeCheck, Heart, Phone } from 'lucide-react';
import { mechanicsApi } from '@/lib/api';
import { sanitizeText, sanitizeBasicHTML, sanitizePhone } from '@/lib/sanitize';
import { gtagEvent } from '@/lib/gtag-events';
import type { Mechanic } from '@/types';
import GalleryCarousel from '@/components/mechanic-detail/GalleryCarousel';
import OperatingStatusBadge from '@/components/mechanic-detail/OperatingStatusBadge';
import ReviewSection from '@/components/mechanic-detail/ReviewSection';
import QuickInfoRow from '@/components/mechanic-detail/QuickInfoRow';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import NaverMapView from '@/components/NaverMapView';
import PhoneRevealBlock from './PhoneRevealBlock';

interface Props {
  slug: string;
}

export default function ShopDetailClient({ slug }: Props) {
  const router = useRouter();
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await mechanicsApi.getBySlug(slug);
        const matched: Mechanic = res.data;
        setMechanic(matched);

        // 클릭수 증가 + GA
        gtagEvent.mechanicDetailView(matched.id, matched.name, matched.location || '');
        mechanicsApi.incrementClick(matched.id).catch(() => {});
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E4015C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-lg">정비소 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (notFound || !mechanic) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-6xl mb-4">🔧</p>
          <h2 className="text-2xl font-black text-gray-900 mb-2">정비소를 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-6">주소를 다시 확인해주세요.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#E4015C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#C70150] transition-colors"
          >
            전체 정비소 보기
          </button>
        </div>
      </div>
    );
  }

  // 갤러리 이미지 목록
  const galleryImages: string[] = [];
  if (mechanic.mainImageUrl) galleryImages.push(mechanic.mainImageUrl);
  if (mechanic.galleryImages) {
    mechanic.galleryImages.forEach((img) => {
      if (!galleryImages.includes(img)) galleryImages.push(img);
    });
  }
  const hasGallery = galleryImages.length > 0;

  const handleShare = async () => {
    const shareData = {
      title: `${mechanic.name} — 꿈꾸는정비사 검증 정비소`,
      text: `${mechanic.location} ${mechanic.name}을 확인해보세요!`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      alert('링크가 복사되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비 */}
      <div className="sticky top-0 z-30 bg-[#E4015C] text-white">
        <div className="max-w-xl mx-auto flex items-center px-4 py-4 gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/90 hover:text-white transition-colors flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={24} />
            <span className="text-base font-semibold hidden sm:inline">목록으로</span>
          </button>
          <h1 className="flex-1 text-center text-[17px] font-bold truncate">
            {sanitizeText(mechanic.name)}
          </h1>
          <button
            onClick={handleShare}
            className="text-white/90 hover:text-white transition-colors flex-shrink-0"
            aria-label="공유"
          >
            <Share2 size={22} />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-white pb-32">

        {/* 갤러리 */}
        {hasGallery ? (
          <div
            className="relative h-72 sm:h-80 bg-gray-200 overflow-hidden"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) >= 50) {
                if (diff > 0) {
                  setGalleryIndex((i) => (i < galleryImages.length - 1 ? i + 1 : 0));
                } else {
                  setGalleryIndex((i) => (i > 0 ? i - 1 : galleryImages.length - 1));
                }
              }
              touchStartX.current = null;
            }}
          >
            <Image
              src={galleryImages[galleryIndex]}
              alt={`${sanitizeText(mechanic.name)} 사진 ${galleryIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
              priority
            />
            {/* 이미지 태그 */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              {['#외관', '#작업장', '#완성차량'].map((tag) => (
                <span
                  key={tag}
                  className="bg-black/60 text-white text-xs px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            {/* 카운터 */}
            {galleryImages.length > 1 && (
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {galleryIndex + 1} / {galleryImages.length}
              </span>
            )}
            {/* 이전/다음 */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((i) => (i > 0 ? i - 1 : galleryImages.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                  aria-label="이전 사진"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setGalleryIndex((i) => (i < galleryImages.length - 1 ? i + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                  aria-label="다음 사진"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-[#E4015C] to-[#FF5CA0] flex items-center justify-center">
            <span className="text-7xl">🔧</span>
          </div>
        )}

        {/* 기본 정보 — 중앙 정렬 */}
        <div className="px-5 pt-7 pb-5 text-center border-b border-gray-100">
          <h2 className="text-[24px] md:text-[28px] font-bold text-gray-900 mb-3 leading-tight">
            {sanitizeText(mechanic.name)}
          </h2>

          {/* 배지 */}
          <div className="flex gap-2 mb-4 flex-wrap justify-center">
            {mechanic.isVerified && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFF1F5] text-[#E4015C] rounded-lg text-[15px] font-semibold">
                <BadgeCheck size={16} />
                검증된 정비소
              </span>
            )}
            {(mechanic.youtubeUrl || mechanic.youtubeLongUrl) && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[15px] font-semibold">
                ▶ 유튜브 촬영
              </span>
            )}
            {mechanic.isPremium && (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-[15px] font-semibold">
                🏆 프리미엄
              </span>
            )}
          </div>

          {/* 주소 */}
          <div className="flex items-center justify-center gap-1.5 text-[17px] text-gray-600 mb-2">
            <MapPin size={18} className="text-[#E4015C] flex-shrink-0" />
            <span>{sanitizeText(mechanic.address)}</span>
          </div>

          {/* 영업 상태 — 중앙 정렬 */}
          <div className="flex justify-center mt-2">
            <OperatingStatusBadge
              operatingHours={mechanic.operatingHours}
              holidays={mechanic.holidays}
            />
          </div>
        </div>

        {/* 전화번호 */}
        <div className="px-5 py-5 border-b border-gray-100">
          <PhoneRevealBlock
            mechanicId={mechanic.id}
            mechanicName={mechanic.name}
            phone={sanitizePhone(mechanic.phone)}
          />
        </div>

        {/* 구분선 */}
        <div className="h-2.5 bg-gray-50" />

        {/* 유튜브 */}
        {(mechanic.youtubeLongUrl || mechanic.youtubeUrl) && (
          <>
            <div className="px-5 py-6">
              <h3 className="text-[20px] font-bold text-gray-900 mb-1 text-center">꿈꾸는정비사가 직접 촬영</h3>
              <p className="text-[14px] text-gray-400 text-center mb-4">정비소 소개 영상</p>
              {mechanic.youtubeLongUrl && (
                <YouTubeEmbed url={mechanic.youtubeLongUrl} variant="long" />
              )}
              {mechanic.youtubeUrl && !mechanic.youtubeLongUrl && (
                <YouTubeEmbed url={mechanic.youtubeUrl} variant="short" />
              )}
            </div>
            <div className="h-2.5 bg-gray-50" />
          </>
        )}

        {/* 소개글 */}
        {mechanic.description && (
          <>
            <div className="px-5 py-6">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4 text-center">소개</h3>
              <p className="text-[17px] md:text-[18px] leading-[1.7] text-gray-600 text-center">
                {sanitizeBasicHTML(mechanic.description)}
              </p>
            </div>
            <div className="h-2.5 bg-gray-50" />
          </>
        )}

        {/* 전문 분야 */}
        {mechanic.specialties && mechanic.specialties.length > 0 && (
          <>
            <div className="px-5 py-6">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4 text-center">전문 분야</h3>
              <div className="flex gap-2 flex-wrap justify-center">
                {mechanic.specialties.map((tag) => (
                  <span
                    key={tag}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-[16px] font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-2.5 bg-gray-50" />
          </>
        )}

        {/* 주차/결제 */}
        <QuickInfoRow
          parkingAvailable={mechanic.parkingAvailable}
          paymentMethods={mechanic.paymentMethods}
        />

        {/* 갤러리 (전체) */}
        {mechanic.galleryImages && mechanic.galleryImages.length > 1 && (
          <>
            <div className="px-5 py-6">
              <h3 className="text-[20px] font-bold text-gray-900 mb-4 text-center">사진</h3>
              <GalleryCarousel
                images={mechanic.galleryImages}
                name={sanitizeText(mechanic.name)}
              />
            </div>
            <div className="h-2.5 bg-gray-50" />
          </>
        )}

        {/* 지도 */}
        <div className="px-5 py-6">
          <h3 className="text-[20px] font-bold text-gray-900 mb-4 text-center">위치</h3>
          {mechanic.mapLat && mechanic.mapLng ? (
            <NaverMapView
              lat={mechanic.mapLat}
              lng={mechanic.mapLng}
              name={sanitizeText(mechanic.name)}
            />
          ) : (
            <div className="h-44 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-[16px]">
              🗺️ 지도 준비 중
            </div>
          )}
          <button
            onClick={() => {
              const url = `https://map.naver.com/v5/search/${encodeURIComponent(mechanic.address)}`;
              window.open(url, '_blank');
            }}
            className="mt-4 w-full py-3.5 border-2 border-gray-200 rounded-xl text-[16px] font-semibold
              text-gray-600 hover:border-[#E4015C] hover:text-[#E4015C] transition-colors"
          >
            네이버 지도에서 길찾기
          </button>
        </div>

        <div className="h-2.5 bg-gray-50" />

        {/* 리뷰 */}
        <div className="px-5 py-6">
          <h3 className="text-[20px] font-bold text-gray-900 mb-4 text-center">리뷰</h3>
          <ReviewSection reviews={mechanic.reviews} mechanicId={mechanic.id} />
        </div>
      </div>

      {/* 하단 고정 CTA 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 md:hidden">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button className="flex items-center justify-center w-11 h-11 rounded-xl border border-[#E5E7EB] text-[#9CA3AF]">
            <Heart size={20} />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-[#E5E7EB] text-[#9CA3AF]"
          >
            <Share2 size={20} />
          </button>
          <a
            href={`tel:${sanitizePhone(mechanic.phone)}`}
            onClick={() => gtagEvent.mechanicPhoneReveal(mechanic.id, mechanic.name)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#E4015C] hover:bg-[#C70150] text-white rounded-xl h-11 text-[16px] font-semibold transition-colors"
          >
            <Phone size={18} />
            전화하기
          </a>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
