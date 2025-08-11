// client/src/components/PageShell.tsx
import clsx from 'clsx'
import React from 'react'

type Props = { className?: string; children: React.ReactNode }

export default function PageShell({ className = '', children }: Props) {
  return (
    <div
      className={clsx(
        'pt-24 w-full max-w-[1000px]',
        'px-3 md:px-8 lg:px-12',    // ← Gallery와 동일한 패딩
        'mx-auto md:ml-0 md:mr-auto',
        className
      )}
    >
      {children}
    </div>
  )
}
