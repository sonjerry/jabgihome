import { ReactNode, CSSProperties } from 'react'
export default function GlassCard({children,className='',style}:{children:ReactNode;className?:string;style?:CSSProperties}){return <div className={`glass rounded-2xl p-4 md:p-6 ${className}`} style={style}>{children}</div>}
