// client/src/components/CommentSection.tsx
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  verifyCommentPassword,
} from '../lib/api'
import GlassCard from './GlassCard'

type CommentItem = {
  id: string
  postId: string
  nickname: string
  content: string
  createdAt: string
}

type Props = { postId: string }

function formatDateTime(s: string) {
  const d = new Date(s)
  // 로컬 포맷 가독성 향상
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const refresh = useCallback(
    () => listComments(postId).then(setComments).catch(console.error),
    [postId]
  )

  useEffect(() => { refresh() }, [refresh])

  const count = useMemo(() => comments.length, [comments])

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!nick.trim() || !password.trim() || !content.trim()) return
    setBusy(true)
    try {
      await createComment(postId, { nickname: nick.trim(), password, content: content.trim() })
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

  function onEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">댓글 <span className="text-cream/70 text-base">({count})</span></h3>
        <button
          onClick={refresh}
          className="text-sm opacity-80 hover:opacity-100 underline"
          aria-label="댓글 새로고침"
        >
          새로고침
        </button>
      </div>

      {/* 목록 */}
      <ul className="space-y-4">
        {comments.length === 0 && (
          <li className="text-cream/70 text-sm">아직 댓글이 없습니다.</li>
        )}

        {comments.map((c) => (
          <li key={c.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              {/* 작성자 + 날짜 */}
              <div className="min-w-0">
                <div className="text-sm text-cream/85">
                  <span className="font-semibold break-all">{c.nickname}</span>
                  <span className="opacity-70"> • {formatDateTime(c.createdAt)}</span>
                </div>

                {editingId === c.id ? (
                  <div className="mt-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="glass rounded-xl px-3 py-2 w-full min-h-[100px]"
                      aria-label="댓글 내용 편집"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={onEditSave}
                        className="rounded-xl px-3 py-1.5 bg-white/15 hover:bg-white/25"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditingContent('') }}
                        className="rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/20"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 leading-relaxed whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                )}
              </div>

              {/* 액션 */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={() => onEditStart(c)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  title="편집"
                  aria-label="댓글 편집"
                >
                  편집
                </button>
                <span className="opacity-30 text-white/30">|</span>
                <button
                  onClick={() => onDelete(c)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  title="삭제"
                  aria-label="댓글 삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* 작성 폼 */}
      <GlassCard>
        <form
          onSubmit={onSubmit}
          className="p-4 md:p-5 space-y-3"
          aria-label="댓글 작성 폼"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,120px] gap-3">
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="닉네임"
              className="glass rounded-xl px-3 py-2 w-full"
              aria-label="닉네임"
              autoComplete="nickname"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              className="glass rounded-xl px-3 py-2 w-full"
              aria-label="비밀번호"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={busy || !nick.trim() || !password.trim() || !content.trim()}
              className="rounded-xl px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-50"
              aria-disabled={busy || !nick.trim() || !password.trim() || !content.trim()}
            >
              {busy ? '등록 중…' : '등록'}
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={onEditorKeyDown}
            placeholder="내용을 입력하세요"
            className="glass rounded-xl px-3 py-2 w-full min-h-[110px]"
            aria-label="댓글 내용"
          />
        </form>
      </GlassCard>
    </div>
  )
}
