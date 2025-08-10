import { motion } from 'framer-motion'
export default function SplitText({ text, className='' }:{ text:string; className?:string }) {
  const words = text.split(' ')
  return (
    <div className={className} aria-label={text}>
      {words.map((w,i)=>(
        <motion.span key={i} className="inline-block mr-2"
          initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: .8 }} transition={{ delay: i*0.04, type: 'spring', stiffness: 400, damping: 20 }}>
          {w}
        </motion.span>
      ))}
    </div>
  )
}
