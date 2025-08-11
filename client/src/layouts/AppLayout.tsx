// src/layouts/AppLayout.tsx
import React from 'react'
import Navbar from '../components/Navbar'
import AudioProvider from '../lib/audio/AudioProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      {/* 고정 사이드바 & 모바일 오버레이 토글은 Navbar에서 처리 */}
      <Navbar />

      {/* 데스크탑(md↑)에서는 사이드바 폭(16rem) 만큼 왼쪽 패딩 */}
      <main className="min-h-screen pl-0 md:pl-64">
        {children}
      </main>
    </AudioProvider>
  )
}
