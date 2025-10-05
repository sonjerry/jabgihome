// client/src/components/SkyBackground.tsx
import React from 'react'

export default function SkyBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* 기본 하늘 그라디언트 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(135, 206, 250, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(173, 216, 230, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(176, 224, 230, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, 
              rgba(135, 206, 250, 0.1) 0%, 
              rgba(173, 216, 230, 0.15) 25%, 
              rgba(176, 224, 230, 0.1) 50%, 
              rgba(135, 206, 235, 0.15) 75%, 
              rgba(173, 216, 250, 0.1) 100%
            ),
            linear-gradient(45deg, #1e3a8a 0%, #3b82f6 25%, #60a5fa 50%, #93c5fd 75%, #dbeafe 100%)
          `
        }}
      />
      
      {/* 부드러운 구름 효과 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.4) 0%, transparent 25%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.3) 0%, transparent 25%),
            radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.2) 0%, transparent 30%),
            radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.3) 0%, transparent 20%),
            radial-gradient(circle at 10% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 25%)
          `
        }}
      />
      
      {/* 미묘한 노이즈 텍스처 */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {/* 반짝이는 효과 */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* 부드러운 빛의 반사 */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%),
            linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)
          `
        }}
      />
    </div>
  )
}
