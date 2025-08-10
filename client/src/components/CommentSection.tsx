// client/src/components/CommentSection.tsx
import { useEffect, useState } from 'react'
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  verifyCommentPassword,
} from '../lib/api'

type CommentItem = {
  id: string
  postId: string
  nickname: string
  content: string
  createdAt: string
}

type Props = { postId: string }

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const refresh = () =>
    listComments(postId).then(setComments).catch(console.error)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function onSubmit() {
    if (!nick.trim() || !password.trim() || !content.trim()) return
    setBusy(true)
    try {
      await createComment(postId, { nickname: nick, password, content })
      setNick('')
      setPassword('')
      setContent('')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  async function onEditStart(c: CommentItem) {
    const pw = prompt('댓글 비밀번호를 입력하세요')
    if (!pw) return
    const ok = await verifyCommentPassword(c.id, pw).catch(() => false)
    if (!ok) {
      alert('비밀번호가 올바르지 않습니다.')
      return
    }
    setEditingId(c.id)
    setEditingContent(c.content)
  }

  async function onEditSave() {
    if (!editingId) return
    const pw = prompt('비밀번호를 다시 입력하세요')
    if (!pw) return
    const ok = await updateComment(editingId, { content: editingContent, password: pw })
      .then((r) => r.ok)
      .catch(() => false)

    if (!ok) {
      alert('수정 실패: 비밀번호를 확인하세요.')
      return
    }
    setEditingId(null)
    setEditingContent('')
    await refresh()
  }

  async function onDelete(c: CommentItem) {
    const pw = prompt('댓글 비밀번호를 입력하세요')
    if (!pw) return
    const ok = await deleteComment(c.id, pw).catch(() => false)
    if (!ok) {
      alert('삭제 실패: 비밀번호를 확인하세요.')
      return
    }
    await refresh()
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-3">댓글</h3>

      {/* 작성 폼 */}
      <div className="glass rounded-2xl p-4 md:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            placeholder="닉네임"
            className="glass rounded-xl px-3 py-2 w-full"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            type="password"
            className="glass rounded-xl px-3 py-2 w-full"
          />
          <button
            disabled={busy || !nick || !password || !content}
            onClick={onSubmit}
            className="rounded-xl px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-50"
          >
            등록
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          className="glass rounded-xl px-3 py-2 w-full mt-3 min-h-[90px]"
        />
      </div>

      {/* 목록 */}
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-cream/80">
                <span className="font-semibold">{c.nickname}</span>
                <span className="opacity-70"> • {new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditStart(c)}
                  className="opacity-80 hover:opacity-100"
                  title="편집"
                  aria-label="편집"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="opacity-80 hover:opacity-100"
                  title="삭제"
                  aria-label="삭제"
                >
                  🗑️
                </button>
              </div>
            </div>

            {editingId === c.id ? (
              <div className="mt-3">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="glass rounded-xl px-3 py-2 w-full min-h-[80px]"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={onEditSave}
                    className="rounded-xl px-3 py-1.5 bg-white/15 hover:bg-white/25"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditingContent('')
                    }}
                    className="rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">{c.content}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
