'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import AnimatedSection from '@/components/animations/AnimatedSection';
import {
  Play,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Wrench,
  Car,
  TrendingUp,
  Users,
  Video,
  Sparkles,
  MessageCircle,
} from 'lucide-react';

type Step = {
  id: number;
  question: string;
  placeholder: string;
  hint: string;
};

const STEPS: Step[] = [
  {
    id: 1,
    question: '어떤 정비 분야를 전문으로 하시나요?',
    placeholder: '예) 타이어, 엔진, 브레이크, 전기장치, 판금 등',
    hint: '가장 자신 있는 분야를 적어주세요',
  },
  {
    id: 2,
    question: '고객들이 가장 많이 물어보는 질문은 무엇인가요?',
    placeholder: '예) 타이어 마모 확인하는 법, 엔진오일 언제 갈아야 하냐 등',
    hint: '하루에 전화나 방문으로 반복되는 질문을 적어주세요',
  },
  {
    id: 3,
    question: '정비하면서 "이런 거 모르면 차 망가진다"고 느낀 순간이 있나요?',
    placeholder: '예) 엔진오일 색깔로 상태 보는 법, 브레이크 패드 직접 확인하는 법 등',
    hint: '고객들이 몰라서 손해 보는 상식들이 최고의 콘텐츠가 됩니다',
  },
  {
    id: 4,
    question: '지금까지 정비하면서 가장 황당했거나 기억에 남는 사례가 있나요?',
    placeholder: '예) 오일 한 방울도 없이 몰고 온 손님, 브레이크 라인에 생수 넣은 차 등',
    hint: '황당한 스토리일수록 조회수가 높습니다',
  },
  {
    id: 5,
    question: '경력이 몇 년이고, 어떤 브랜드 차량을 주로 보시나요?',
    placeholder: '예) 20년차, 현대/기아 중심, 수입차도 가능 등',
    hint: '연차와 전문 브랜드는 시청자 신뢰의 핵심입니다',
  },
];

type IdeaResult = {
  title: string;
  hook: string;
  why: string;
};

function generateIdeas(answers: string[]): IdeaResult[] {
  const specialty = answers[0] || '정비';
  const faq = answers[1] || '소모품 교체';
  const knowledge = answers[2] || '점검 방법';
  const story = answers[3] || '황당 사례';

  return [
    {
      title: `"${specialty} 정비사가 절대 안 하는 실수 5가지"`,
      hook: `"이거 하면 차 10년 더 탑니다"`,
      why: '자동차 유지에 돈을 쓰는 35-54세가 반응하는 포맷. 제목에 숫자+금지어 조합이 클릭률 2배.',
    },
    {
      title: `"${faq}에 대한 정비사의 솔직한 대답"`,
      hook: `"사실 딜러가 알려주지 않는 게 있습니다"`,
      why: '정보를 숨긴다는 구도는 조회수가 높습니다. 시청자가 "나만 몰랐나?" 하며 공유하게 됩니다.',
    },
    {
      title: `"${knowledge}, 정비소 가기 전에 직접 확인하는 법"`,
      hook: `"10초면 됩니다. 핸드폰 꺼내세요"`,
      why: '직접 해볼 수 있다는 느낌이 구독 전환율을 높입니다. 저관여 정보가 고관여 팬을 만듭니다.',
    },
    {
      title: `"실제로 입고된 차 보여드립니다 (${story.slice(0, 15)}...)"`,
      hook: `"이 차 주인분, 정말 다행입니다"`,
      why: '실제 정비 현장 공개는 신뢰도 1위 포맷. 비포/애프터 구조로 편집하면 완주율이 높습니다.',
    },
    {
      title: `"${specialty} 전문 ${answers[4] ? answers[4].split(',')[0] : '20년차'} 정비사가 직접 알려주는 셀프 점검법"`,
      hook: `"정비소 안 가도 됩니다, 이것만 알면"`,
      why: '경력+전문분야 강조는 전문가 권위를 만듭니다. 채널 브랜딩의 핵심 영상이 됩니다.',
    },
  ];
}

export default function YouTubeIdeaPage() {
  const [currentStep, setCurrentStep] = useState(0); // 0: 시작 화면
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [ideas, setIdeas] = useState<IdeaResult[]>([]);
  const [done, setDone] = useState(false);

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentStep - 1] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setIdeas(generateIdeas(newAnswers));
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers(['', '', '', '', '']);
    setCurrentAnswer('');
    setIdeas([]);
    setDone(false);
  };

  const progress = currentStep > 0 ? (currentStep / STEPS.length) * 100 : 0;

  return (
    <Layout>
      {/* 히어로 */}
      <section className="min-h-[60vh] md:min-h-[70vh] flex items-center relative overflow-hidden bg-[#0a0a0a] pt-16 md:pt-20">
        <div className="container mx-auto px-5 md:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-[#a6f546] text-xs md:text-sm font-semibold tracking-[0.2em] mb-4">
              YOU ANSWER, WE PLAN
            </p>
            <h1
              className="font-black text-white leading-[1.12] mb-5 break-keep"
              style={{ fontSize: 'clamp(1.75rem, 6vw, 4rem)' }}
            >
              5가지 질문에 답하면
              <br />
              <span className="bg-[#a6f546] text-[#111] px-1.5 py-0.5">
                유튜브 콘텐츠 기획안
              </span>
              이 나옵니다.
            </h1>
            <p
              className="text-gray-400 mb-8 break-keep"
              style={{ fontSize: 'clamp(0.938rem, 2vw, 1.25rem)' }}
            >
              정비사 20년 경험이 유튜브 조회수로 바뀌는 순간.<br />
              코딩도, 촬영 경험도 없어도 됩니다.
            </p>

            {currentStep === 0 && (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] px-6 py-3.5 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-lg transition-all shadow-lg shadow-[#a6f546]/20"
              >
                지금 시작하기
                <ArrowRight size={18} />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* 다크 → 라이트 전환 */}
      <div className="h-16 md:h-24 bg-gradient-to-b from-[#0a0a0a] to-[#F8F7FC]" />

      {/* 메인 콘텐츠 */}
      <section className="bg-[#F8F7FC] pb-20 md:pb-32">
        <div className="container mx-auto px-5 md:px-6">
          <AnimatePresence mode="wait">
            {/* ── 질문 단계 ── */}
            {currentStep > 0 && !done && (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl mx-auto"
              >
                {/* 진행 바 */}
                <div className="mb-8">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>{currentStep} / {STEPS.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-[#a6f546] h-2 rounded-full"
                      initial={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* 질문 카드 */}
                <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#a6f546] rounded-xl flex items-center justify-center">
                      <span className="text-[#111] font-black text-lg">{currentStep}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold tracking-wider">QUESTION {currentStep}</p>
                  </div>

                  <h2
                    className="font-black text-[#111] mb-2 break-keep leading-snug"
                    style={{ fontSize: 'clamp(1.125rem, 3vw, 1.75rem)' }}
                  >
                    {STEPS[currentStep - 1].question}
                  </h2>
                  <p className="text-gray-400 text-sm mb-6 flex items-center gap-1.5">
                    <Lightbulb size={14} className="text-[#a6f546]" />
                    {STEPS[currentStep - 1].hint}
                  </p>

                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-4 text-[#111] text-sm md:text-base placeholder:text-gray-300 focus:outline-none focus:border-[#a6f546] focus:ring-2 focus:ring-[#a6f546]/20 resize-none transition-all"
                    rows={4}
                    placeholder={STEPS[currentStep - 1].placeholder}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey && currentAnswer.trim()) {
                        handleNext();
                      }
                    }}
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[11px] text-gray-300">⌘ + Enter로 넘어가기</p>
                    <button
                      onClick={handleNext}
                      disabled={!currentAnswer.trim()}
                      className="inline-flex items-center gap-2 bg-[#111] disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                    >
                      {currentStep === STEPS.length ? '기획안 생성' : '다음'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 결과 화면 ── */}
            {done && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto"
              >
                {/* 완료 배너 */}
                <div className="bg-[#111] rounded-2xl p-6 md:p-8 mb-8 text-center">
                  <div className="w-14 h-14 bg-[#a6f546] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={26} className="text-[#111]" />
                  </div>
                  <h2 className="text-white font-black text-xl md:text-3xl mb-2 break-keep">
                    기획안이 완성됐습니다!
                  </h2>
                  <p className="text-gray-400 text-sm">
                    아래 5개의 영상 기획안을 가져가세요.
                  </p>
                </div>

                {/* 아이디어 카드 */}
                <div className="space-y-4 mb-10">
                  {ideas.map((idea, i) => (
                    <AnimatedSection key={i} animation="slideUp" delay={i * 0.1} duration={0.5}>
                      <div className="bg-white rounded-2xl p-5 md:p-7 border border-gray-100 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Play size={16} className="text-white ml-0.5" fill="white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1.5">
                              영상 #{i + 1}
                            </p>
                            <h3 className="font-black text-[#111] text-base md:text-lg mb-2 break-keep leading-snug">
                              {idea.title}
                            </h3>
                            <div className="bg-[#a6f546]/10 border border-[#a6f546]/20 rounded-lg px-3 py-2 mb-3">
                              <p className="text-xs font-bold text-[#65a30d]">훅 (첫 3초)</p>
                              <p className="text-sm text-[#111] font-semibold break-keep">{idea.hook}</p>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <TrendingUp size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-gray-500 break-keep leading-relaxed">{idea.why}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                {/* 다음 단계 CTA */}
                <div className="bg-gradient-to-br from-[#a6f546]/10 to-lime-50 rounded-2xl p-6 md:p-8 border border-[#a6f546]/15 text-center mb-6">
                  <h3 className="font-black text-[#111] text-lg md:text-2xl mb-2 break-keep">
                    영상을 만들었다면, 이제 정비소를 알릴 차례입니다.
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 break-keep">
                    꿈꾸는 정비사 플랫폼에 입점하면<br />
                    유튜브 영상이 고객 유입으로 직결됩니다.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href="/for-mechanics"
                      className="inline-flex items-center justify-center gap-2 bg-[#111] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:bg-[#222]"
                    >
                      입점 자세히 보기
                      <ArrowRight size={16} />
                    </a>
                    <a
                      href="/owner/login"
                      className="inline-flex items-center justify-center gap-2 bg-[#a6f546] text-[#111] px-6 py-3 rounded-xl font-bold text-sm transition-all hover:bg-[#8fd93a]"
                    >
                      지금 입점 신청
                      <ChevronRight size={16} />
                    </a>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleReset}
                    className="text-sm text-gray-400 hover:text-[#111] underline transition-colors"
                  >
                    다시 만들기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 시작 전: 서비스 소개 */}
          {currentStep === 0 && (
            <AnimatedSection animation="slideUp" delay={0.2} duration={0.7}>
              <div className="max-w-5xl mx-auto mt-4">
                {/* 작동 방식 */}
                <div className="text-center mb-10 md:mb-16">
                  <p className="text-[#65a30d] text-xs font-semibold tracking-[0.2em] mb-3">
                    HOW IT WORKS
                  </p>
                  <h2
                    className="font-black text-[#111] break-keep"
                    style={{ fontSize: 'clamp(1.25rem, 3.5vw, 2.5rem)' }}
                  >
                    답하기만 하면 됩니다
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 md:mb-20">
                  {[
                    {
                      icon: <MessageCircle size={22} className="text-[#111]" />,
                      bg: 'bg-[#a6f546]',
                      step: '01',
                      title: '5가지 질문에 답한다',
                      desc: '전문 분야, 자주 받는 질문, 황당했던 사례 등 경험에서 나오는 답변',
                    },
                    {
                      icon: <Sparkles size={22} className="text-white" />,
                      bg: 'bg-[#111]',
                      step: '02',
                      title: '기획안이 자동 생성',
                      desc: '제목, 첫 3초 훅, 이 영상이 잘 되는 이유까지 5개 기획안 완성',
                    },
                    {
                      icon: <Video size={22} className="text-[#111]" />,
                      bg: 'bg-[#a6f546]',
                      step: '03',
                      title: '찍고 올리면 끝',
                      desc: '기획안대로 촬영만 하면 됩니다. 편집 앱은 캡컷으로 충분합니다',
                    },
                  ].map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                      <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                        {card.icon}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest mb-1">{card.step}</p>
                      <h3 className="font-black text-[#111] text-base mb-2 break-keep">{card.title}</h3>
                      <p className="text-gray-500 text-sm break-keep leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>

                {/* 잘 되는 영상 포맷 예시 */}
                <div className="bg-[#111] rounded-2xl p-6 md:p-10 mb-12">
                  <p className="text-[#a6f546] text-xs font-semibold tracking-[0.2em] mb-4 text-center">
                    조회수 높은 정비 영상 포맷
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { tag: '리스트형', title: '"정비사가 절대 사지 말라는 타이어 3종"', views: '30~100만' },
                      { tag: '비포/애프터', title: '"이 차 들어왔을 때 vs 나갈 때"', views: '10~50만' },
                      { tag: '팩폭형', title: '"솔직히 엔진오일 1년에 한 번은 안 됩니다"', views: '20~80만' },
                      { tag: '셀프점검', title: '"브레이크 언제 갈아야 할지, 직접 확인하는 법"', views: '15~60만' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4">
                        <div className="w-2 h-2 bg-[#a6f546] rounded-full mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] text-[#a6f546] font-bold">{item.tag}</span>
                          <p className="text-white text-sm font-semibold break-keep mt-0.5">{item.title}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">예상 조회수 {item.views}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 하단 CTA */}
                <div className="text-center">
                  <button
                    onClick={handleStart}
                    className="inline-flex items-center gap-2 bg-[#a6f546] hover:bg-[#8fd93a] text-[#111] px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#a6f546]/20"
                  >
                    지금 기획안 만들기
                    <ArrowRight size={20} />
                  </button>
                  <p className="text-gray-400 text-xs mt-3">무료 · 로그인 불필요 · 2분이면 완성</p>
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </Layout>
  );
}
