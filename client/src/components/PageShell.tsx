// client/src/components/PageShell.tsx
import clsx from 'clsx'
import React from 'react'

type Props = { className?: string; children: React.ReactNode }

export default function PageShell({ className = '', children }: Props) {
  return (
    <div
      className={clsx(
        // 모바일: 적당한 패딩
        // 데스크탑(md↑): 사이드바로 밀린 상태에서 좌정렬(ml-0), 오른쪽만 여유(pr-8)
        'pt-24 w-full max-w-[1000px] px-3 sm:px-4',
        'mx-auto md:ml-0 md:mr-auto', // ← 중앙정렬 → 데스크탑에선 좌정렬로 전환
        'md:pl-2 md:pr-8',            // ← 왼쪽 최소, 오른쪽 여유
        className
      )}
    >
      {children}
    </div>
  )
}
