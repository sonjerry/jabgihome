// client/src/router/PageTransition.tsx
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
  isHomePage: boolean
}

const transition = { 
  duration: 0.15, 
  ease: [0.22, 0.61, 0.36, 1] 
}

export default function PageTransition({ children, isHomePage }: PageTransitionProps) {
  const [pointerEvents, setPointerEvents] = useState<'auto' | 'none'>('auto')
  const location = useLocation()
  
  // 라우트 변경 시 포인터 이벤트 즉시 활성화
  useEffect(() => {
    setPointerEvents('auto')
  }, [location.pathname])
  
  return (
    <motion.div
      style={{ 
        pointerEvents, 
        contain: 'content' 
      }}
      initial={isHomePage ? { opacity: 0 } : { opacity: 0, y: 5 }}
      animate={isHomePage ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={isHomePage ? { opacity: 0 } : { opacity: 0, y: -5 }}
      transition={transition}
      onAnimationStart={() => setPointerEvents('auto')}
      onAnimationComplete={() => setPointerEvents('auto')}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
