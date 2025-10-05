// client/src/lib/api.ts
import type { Post, Attachment } from '../types'

/** ───────────────── 공통 설정 ─────────────────
 * 프로덕션: VITE_API_URL 사용 (예: https://api.example.com)
 * 개발:     프록시(/api -> http://localhost:4000) 사용
 */
const ENV_BASE = import.meta.env.VITE_API_URL as string | undefined
const isProd = import.meta.env.PROD

// prod이면 ENV_BASE 필수, dev면 ''로 두고 /api 프록시 사용
const API_BASE = (isProd ? (ENV_BASE ?? '') : '') || ''

// 모든 경로는 /api 로 시작하도록 강제 (중복 슬래시 제거 포함)
function joinApi(path: string) {
  const p = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`
  if (!API_BASE) return p // dev 프록시
  return `${API_BASE.replace(/\/+$/,'')}${p}`
}

async function handle<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let msg = r.statusText
    try { msg = await r.text() } catch {}
    throw new Error(msg || `HTTP ${r.status}`)
  }
  // 일부 API는 204 No Content일 수 있음
  if (r.status === 204) return undefined as unknown as T
  return r.json() as Promise<T>
}

// 공통 옵션: 쿠키 기반 인증 사용 시 credentials: 'include'
const withCreds: RequestInit = { credentials: 'include' }

/** ─────────── 기본 메서드 ─────────── */
export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(joinApi(path), { ...withCreds })
  return handle<T>(r)
}
export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(joinApi(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...withCreds,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  return handle<T>(r)
}
export async function apiPut<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(joinApi(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    ...withCreds,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  return handle<T>(r)
}
export async function apiDelete<T>(path: string, body?: any): Promise<T> {
  const init: RequestInit = {
    method: 'DELETE',
    headers: undefined,
    ...withCreds,
  }
  if (body != null) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  const r = await fetch(joinApi(path), init)
  return handle<T>(r)
}

/** ─────────── Auth ─────────── */
export const AuthAPI = {
  me:    () => apiGet<{ role: 'admin' | 'guest' }>('/auth/me'),
  login: (password: string) => apiPost<{ ok: true }>('/auth/login', { password }),
  logout: () => apiPost<{ ok: true }>('/auth/logout'),
}

/** ─────────── Posts ─────────── */
export async function listPosts(): Promise<Post[]> {
  return apiGet<Post[]>('/posts')
}
export async function getPost(id: string): Promise<Post> {
  return apiGet<Post>(`/posts/${id}`)
}
export async function savePost(p: Post): Promise<Post> {
  return apiPost<Post>('/posts', p)
}
export async function updatePost(p: Post): Promise<{ ok: boolean; id: string }> {
  if (!p.id) throw new Error('id required')
  return apiPut<{ ok: boolean; id: string }>(`/posts/${p.id}`, p)
}
export async function uploadFile(file: File): Promise<Attachment> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(joinApi('/upload'), {
    method: 'POST',
    body: fd,
    ...withCreds,
  })
  return handle<Attachment>(r)
}

/** ─────────── Comments ───────────
 * 서버 규약:
 * GET    /api/posts/:postId/comments           -> CommentItem[]
 * POST   /api/posts/:postId/comments           -> { id }
 * POST   /api/comments/:cid/verify             -> { ok: boolean }
 * PUT    /api/comments/:cid                    -> { ok: boolean }  (body: { content, password })
 * DELETE /api/comments/:cid                    -> { ok: boolean }  (body: { password })
 */
export type CommentItem = {
  id: string
  postId: string
  nickname: string
  content: string
  createdAt: string
}

export async function listComments(postId: string): Promise<CommentItem[]> {
  return apiGet<CommentItem[]>(`/posts/${postId}/comments`)
}

export async function createComment(
  postId: string,
  body: { nickname: string; password: string; content: string }
): Promise<{ id: string }> {
  return apiPost<{ id: string }>(`/posts/${postId}/comments`, body)
}

export async function verifyCommentPassword(
  commentId: string,
  password: string
): Promise<boolean> {
  const data = await apiPost<{ ok: boolean }>(`/comments/${commentId}/verify`, { password })
  return !!data.ok
}

export async function updateComment(
  commentId: string,
  body: { content: string; password: string }
): Promise<{ ok: boolean }> {
  return apiPut<{ ok: boolean }>(`/comments/${commentId}`, body)
}

export async function deleteComment(
  commentId: string,
  password: string
): Promise<boolean> {
  const data = await apiDelete<{ ok: boolean }>(`/comments/${commentId}`, { password })
  return !!data.ok
}

/** ─────────── Threaded Comments (gallery/model/tier) ─────────── */
export type ThreadComment = {
  id: string
  threadKey: string
  nickname: string
  content: string
  createdAt: string
}

export const ThreadAPI = {
  list: (key: string) => apiGet<ThreadComment[]>(`/threads/${encodeURIComponent(key)}/comments`),
  create: (key: string, body: { nickname: string; password: string; content: string }) =>
    apiPost<{ id: string }>(`/threads/${encodeURIComponent(key)}/comments`, body),
  verify: (cid: string, password: string) =>
    apiPost<{ ok: boolean }>(`/threads-comments/${cid}/verify`, { password }).then(r => !!r.ok),
  update: (cid: string, body: { content: string; password?: string }) =>
    apiPut<{ ok: boolean }>(`/threads-comments/${cid}`, body).then(r => !!r.ok),
  delete: (cid: string, body?: { password?: string }) =>
    apiDelete<{ ok: boolean }>(`/threads-comments/${cid}`, body).then(r => !!r.ok),
}

/** ─────────── Reviews (admin-only) ─────────── */
export type Review = { key: string; rating: number; text: string; updatedAt: string }
export const ReviewAPI = {
  get: (key: string) => apiGet<Review | null>(`/reviews/${encodeURIComponent(key)}`),
  save: (key: string, rating: number, text: string) => apiPut<{ ok: boolean }>(`/reviews/${encodeURIComponent(key)}`, { rating, text }),
  remove: (key: string) => apiDelete<{ ok: boolean }>(`/reviews/${encodeURIComponent(key)}`).then(r => !!r.ok),
}
