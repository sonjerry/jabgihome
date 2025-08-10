// client/src/lib/api.ts
import type { Post, Attachment } from '../types'

const base = import.meta.env.VITE_API_BASE || '' // proxy to /api
// 4000 서버로 직접 붙습니다 (프록시 미사용)
const BASE = 'http://localhost:4000';

async function handle(r: Response) {
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.json();
}

export async function apiGet<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url, { credentials: 'include' });
  return handle(r);
}

export async function apiPost<T>(url: string, body?: any): Promise<T> {
  const r = await fetch(BASE + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ← 쿠키 전송 필수
    body: body ? JSON.stringify(body) : undefined,
  });
  return handle(r);
}

export const AuthAPI = {
  me: () => apiGet<{ role: 'admin'|'guest' }>('/api/auth/me'),
  login: (password: string) => apiPost<{ ok: true }>('/api/auth/login', { password }),
  logout: () => apiPost<{ ok: true }>('/api/auth/logout'),
};

// ===== Posts (프록시 경로 유지) =====
export async function listPosts(): Promise<Post[]> {
  const r = await fetch(`${base}/api/posts`)
  if(!r.ok) throw new Error('list failed')
  return r.json()
}

export async function getPost(id:string): Promise<Post> {
  const r = await fetch(`${base}/api/posts/${id}`)
  if(!r.ok) throw new Error('get failed')
  return r.json()
}

export async function savePost(p: Post): Promise<Post> {
  const r = await fetch(`${base}/api/posts`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(p)
  })
  if(!r.ok) throw new Error('save failed')
  return r.json()
}

export async function deletePost(id:string): Promise<void> {
  const r = await fetch(`${base}/api/posts/${id}`, { method:'DELETE' })
  if(!r.ok) throw new Error('delete failed')
}

export async function uploadFile(file: File): Promise<Attachment> {
  const fd = new FormData(); fd.append('file', file)
  const r = await fetch(`${base}/api/upload`, { method:'POST', body: fd })
  if(!r.ok) throw new Error('upload failed')
  return r.json()
}

// ===== Comments (직접 4000 포트로) =====
// 서버 규약:
// GET    /api/posts/:postId/comments           -> Comment[]
// POST   /api/posts/:postId/comments           -> { id }
// POST   /api/comments/:cid/verify             -> { ok: boolean }
// PUT    /api/comments/:cid                    -> { ok: boolean }  (body: { content, password })
// DELETE /api/comments/:cid                    -> { ok: boolean }  (body: { password })

export type CommentItem = {
  id: string
  postId: string
  nickname: string
  content: string
  createdAt: string
}

export async function listComments(postId: string): Promise<CommentItem[]> {
  const r = await fetch(`${BASE}/api/posts/${postId}/comments`, {
    credentials: 'include',
  })
  if (!r.ok) throw new Error('comments list failed')
  return r.json()
}

export async function createComment(
  postId: string,
  body: { nickname: string; password: string; content: string }
): Promise<{ id: string }> {
  const r = await fetch(`${BASE}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error('comment create failed')
  return r.json()
}

export async function verifyCommentPassword(
  commentId: string,
  password: string
): Promise<boolean> {
  const r = await fetch(`${BASE}/api/comments/${commentId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  })
  if (!r.ok) return false
  const data = await r.json() as { ok: boolean }
  return data.ok
}

export async function updateComment(
  commentId: string,
  body: { content: string; password: string }
): Promise<{ ok: boolean }> {
  const r = await fetch(`${BASE}/api/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error('comment update failed')
  return r.json()
}

export async function deleteComment(
  commentId: string,
  password: string
): Promise<boolean> {
  const r = await fetch(`${BASE}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  })
  if (!r.ok) return false
  const data = await r.json() as { ok: boolean }
  return data.ok
}
