import React from 'react'
import Navbar from '../components/Navbar'
import AudioProvider from '../lib/audio/AudioProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioProvider>
      <Navbar />
      {/* 데스크탑(md↑)에서만 사이드바 폭(16rem) 만큼 본문을 밀어냄 */}
      <main className="min-h-screen pl-0 md:pl-64">
        {children}
      </main>
    </AudioProvider>
  )
}
