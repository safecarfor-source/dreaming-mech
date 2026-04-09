import { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/data/blog-posts';

const SITE_URL = 'https://dreammechaniclab.com';

export const metadata: Metadata = {
  title: '정비 가이드 블로그 | 꿈꾸는정비사',
  description:
    '20년 경력 정비사가 알려주는 자동차 정비 가이드. 엔진오일, 타이어, 브레이크, 디젤 관리법까지. 영상과 글로 쉽게 배우세요.',
  openGraph: {
    title: '정비 가이드 블로그 | 꿈꾸는정비사',
    description:
      '20년 경력 정비사가 알려주는 자동차 정비 가이드. 영상과 글로 쉽게 배우세요.',
    url: `${SITE_URL}/blog`,
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="px-5 pt-12 pb-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-[28px] font-bold text-gray-900 mb-3">
            정비 가이드
          </h1>
          <p className="text-[16px] text-gray-500">
            20년 경력 정비사가 알려주는 자동차 관리 이야기
          </p>
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="max-w-2xl mx-auto space-y-4">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block border border-gray-200 rounded-2xl p-6 hover:border-[#E4015C] hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[12px] px-2.5 py-1 bg-[#FFF0F5] text-[#E4015C] rounded-full font-semibold">
                  {post.category}
                </span>
                <span className="text-[12px] text-gray-400">
                  {post.readTime}분 읽기
                </span>
              </div>
              <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                {post.title}
              </h2>
              <p className="text-[15px] text-gray-500">{post.subtitle}</p>
            </Link>
          ))}

          {BLOG_POSTS.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-[16px]">아직 작성된 글이 없어요.</p>
              <p className="text-[14px] mt-2">곧 유용한 정비 가이드가 올라올 예정이에요.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
