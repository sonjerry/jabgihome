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

      <section className="relative z-10 w-full h-screen p-4 md:p-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl">
          {/* 상단 헤더 및 소개 섹션 */}
          <header className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-10">
            <div className="text-left md:text-left mb-4 md:mb-0">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
                이가을 블로그
              </h1>
              <p className="mt-2 text-md md:text-lg text-amber-300">
                인스타 싫어서 홈페이지 직접 만듬
              </p>
            </div>
            <div className="flex flex-row items-center justify-start md:justify-end gap-2">
              <Badge text={today} color="white" />
              <Badge text="Glass v4" color="emerald" />
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
                  인스타 싫어서 홈페이지 만듬
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

      {/* 스티커 */}
      {!showVideo && (
        <div className="pointer-events-none hidden md:block">
          <div className="absolute right-1 bottom-1 w-[180px] opacity-80">
            <Stickers />
          </div>
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

// Badge
function Badge({
  text,
  color,
}: {
  text: string;
  color: 'white' | 'emerald' | 'black';
}) {
  const colorClass = {
    white: 'border-white/15 bg-white/10 text-white/90',
    emerald: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
    black: 'border-white/15 bg-black/30 text-white/90',
  }[color];

  return (
    <span
      className={`rounded-full border backdrop-blur px-2.5 py-1 text-[10px] md:text-xs ${colorClass}`}
    >
      {text}
    </span>
  );
}

// TagChip
function TagChip({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] md:text-xs text-white/80">
      {text}
    </span>
  );
}