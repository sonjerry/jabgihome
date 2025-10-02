import { ReactNode, CSSProperties } from 'react'
export default function GlassCard({children,className='',style}:{children:ReactNode;className?:string;style?:CSSProperties}){return <div className={`glass rounded-2xl p-4 md:p-6 ${className}`} style={style}>{children}</div>}

export function GlassTitle({ children, className='' }:{ children:ReactNode; className?:string }){
  return <h3 className={`font-extrabold tracking-tight leading-none ${className}`}>{children}</h3>
}

export function GlassText({ children, className='' }:{ children:ReactNode; className?:string }){
  return <p className={`text-white/70 mt-4 ${className}`}>{children}</p>
}