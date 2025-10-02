import { ReactNode, CSSProperties } from 'react'

type GlassVariant = 'default' | 'strong'

export default function GlassCard({
  children,
  className = '',
  style,
  variant = 'default',
}:{
  children: ReactNode
  className?: string
  style?: CSSProperties
  variant?: GlassVariant
}) {
  const variantClasses = variant === 'strong'
    ? 'bg-white/20 hover:bg-white/30'
    : ''
  return (
    <div className={`glass rounded-2xl p-4 md:p-6 ${variantClasses} ${className}`} style={style}>
      {children}
    </div>
  )
}

export function GlassTitle({ children, className='' }:{ children:ReactNode; className?:string }){
  return <h3 className={`font-extrabold tracking-tight leading-none ${className}`}>{children}</h3>
}

export function GlassText({ children, className='' }:{ children:ReactNode; className?:string }){
  return <p className={`text-white/70 mt-4 ${className}`}>{children}</p>
}