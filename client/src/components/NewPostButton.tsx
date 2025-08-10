import { Link } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function NewPostButton() {
  const { role } = useAuth()
  if (role !== 'admin') return null
  return (
    <Link
      to="/blog/new"
      className="glass px-3 py-1.5 rounded-xl text-sm hover:bg-white/20"
    >
      newPost
    </Link>
  )
}
