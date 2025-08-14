// client/src/pages/Home.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import FullscreenVideoModal from '../components/FullscreenVideoModal';
import Stickers from '../components/StickerPeel';
import GlassCard from '../components/GlassCard';

export default function Home() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('videoShown');
    if (!seen) setShowVideo(true);
  }, []);

  const closeVideo = () => {
    sessionStorage.setItem('videoShown', '1');
    setShowVideo(false);
  };

  // 이 페이지에 있는 동안만 세로 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <FullscreenVideoModal open={showVideo} onClose={closeVideo} />

      {/* 본문 */}
      <section className="relative z-10 w-full h-screen p-4 md:p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl">
          {/* 상단 헤더 및 소개 섹션 */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-10">
            <div className="text-left md:text-left mb-4 md:mb-0">
              <h1 className="text-4xl md:text-8xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                이가을 블로그
              </h1>
              <p className="mt-6 text-md md:text-lg text-amber-300">
                인스타 싫어서 홈페이지 직접 만듬
              </p>
            </div>
          </header>

          {/* 메인 컨텐츠 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            {/* 좌측 카드: 소개 및 내비게이션 */}
            <GlassCard className="p-6 md:p-8 flex flex-col justify-between order-2 lg:order-1">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-amber-300">
                  홈페이지 소개
                </h2>
                <p className="mt-4 text-sm md:text-base text-white/90 leading-relaxed">
                  제가 평소에 소개하고 싶었던 것들을 전시합니다.
                </p>
              </div>
              <nav className="mt-6 grid grid-cols-3 gap-3">
                <CTA to="/blog" title="블로그" />
                <CTA to="/gallery" title="갤러리" />
                <CTA to="#" title="준비중" />
              </nav>
            </GlassCard>

            {/* 우측 카드: 연락처 정보 */}
            <GlassCard className="p-6 md:p-8 flex flex-col justify-end order-1 lg:order-2">
              <div className="mt-auto">
                <h2 className="text-lg md:text-xl font-semibold text-white/80 mb-3">
                  Contact Me
                </h2>
                <div className="flex flex-col gap-2">
                  <MiniStat
                    label="GitHub"
                    value="sonjerry"
                    link="https://github.com/sonjerry"
                  />
                  <MiniStat
                    label="Email"
                    value="qh.e.720@icloud.com"
                    link="mailto:qh.e.720@icloud.com"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 스티커: 화면 전체 오버레이 (모달이 떠있을 땐 렌더 안함) */}
      {!showVideo && (
        <div className="fixed inset-0 z-[2000] pointer-events-none">
          <Stickers />
        </div>
      )}
    </main>
  );
}

/* ───────────────────── 보조 컴포넌트 ───────────────────── */

// CTA
function CTA({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="
        block text-center rounded-2xl
        border border-white/20 bg-white/10 hover:bg-white/20 transition
        backdrop-blur px-3 py-2
        text-sm md:text-base
      "
    >
      {title}
    </Link>
  );
}

// MiniStat
function MiniStat({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link: string;
}) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl border border-white/15 bg-white/10 hover:bg-white/20 backdrop-blur px-3 py-2 transition"
    >
      <div className="text-[10px] md:text-xs text-white/70">{label}</div>
      <div className="text-sm md:text-base font-semibold">{value}</div>
    </a>
  );
}
