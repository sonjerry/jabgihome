import { motion } from 'framer-motion'
export default function ScrollFloatItem({ children }:{ children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .6 }} transition={{ type:'spring', stiffness: 120, damping: 18 }}>
      {children}
    </motion.div>
  )
}
