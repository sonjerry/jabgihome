// server.js
import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { customAlphabet } from 'nanoid'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/* ───────────────────── 공통 경로 ───────────────────── */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

/* ───────────────────── CORS 설정 ───────────────────── */
const ALLOW_ORIGINS = (process.env.ALLOW_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// 견고한 CORS: 요청의 Access-Control-Request-Headers 에코
app.use((req, res, next) => {
  const origin = req.headers.origin
  const isAllowed = origin && ALLOW_ORIGINS.includes(origin)

  if (isAllowed) {
    res.header('Vary', 'Origin')
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')

    // 브라우저가 보낸 헤더 목록을 그대로 허용(소문자/대문자 혼재 대응)
    const reqAllowHeaders = req.headers['access-control-request-headers']
    if (reqAllowHeaders && typeof reqAllowHeaders === 'string') {
      res.header('Access-Control-Allow-Headers', reqAllowHeaders)
    } else {
      // 요청에 명시가 없으면 보수적으로 넓게
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept, Accept-Language, Cache-Control, Pragma'
      )
    }
    // 프리플라이트 캐시
    res.header('Access-Control-Max-Age', '86400')
  }

  // 허용 origin에서 온 OPTIONS는 즉시 204
  if (req.method === 'OPTIONS' && isAllowed) {
    return res.sendStatus(204)
  }
  next()
})

/* ───────────────────── 바디 파서 ───────────────────── */
// JSON (모바일 환경 대비 용량 여유)
app.use(express.json({ limit: '25mb' }))
// 폼-urlencoded
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
// 텍스트(일부 모바일/라이브러리가 text/plain으로 JSON 문자열을 전송하는 경우 대비)
app.use(express.text({ type: ['text/plain', 'application/x-ndjson'], limit: '25mb' }))

app.use(cookieParser())

/* (선택) 요청 디버그 — 필요 시 주석 해제
app.use((req, _res, next) => {
  if (req.method !== 'GET') {
    console.log('[REQ]', req.method, req.url, {
      origin: req.headers.origin,
      contentType: req.headers['content-type'],
      acrh: req.headers['access-control-request-headers'],
      hasCookie: Boolean(req.headers.cookie),
    })
  }
  next()
})
*/

/* ───────────────────── 환경 변수 ───────────────────── */
const PORT = Number((process.env.PORT || 4000).toString().trim())
const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret').toString().trim()
const ADMIN_HASH = (process.env.ADMIN_HASH || '').toString().trim()

if (!ADMIN_HASH) {
  console.error('[FATAL] .env에 ADMIN_HASH가 없습니다.')
  process.exit(1)
}

/* ───────────────────── Supabase 클라이언트 ───────────────────── */
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // 반드시 service_role 키
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'media'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[FATAL] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 없습니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

;(async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      console.error('[WARN] service_role 권한 확인 실패:', error.message)
      console.error('       SUPABASE_SERVICE_ROLE_KEY에 anon 키가 들어갔을 가능성이 높습니다.')
    } else {
      const names = (data || []).map(b => b.name)
      console.log(`[OK] Supabase 연결. 버킷: ${names.join(', ') || '(none)'}`)
      if (names.length && !names.includes(SUPABASE_BUCKET)) {
        console.warn(`[WARN] SUPABASE_BUCKET="${SUPABASE_BUCKET}" 버킷이 존재하지 않습니다. 대시보드에서 생성하세요.`)
      }
    }
  } catch (e) {
    console.error('[WARN] service_role 검증 중 예외:', e?.message || e)
  }
})()

/* ───────────────────── 업로드 설정 (메모리) ───────────────────── */
const nanoid10 = customAlphabet('1234567890abcdef', 10)
const nanoid12 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12) // 댓글 id
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|gif|webp|svg\+xml|svg|heic|heif)$/.test(file.mimetype)
    cb(ok ? null : new Error('Only image files are allowed'), ok)
  },
})

/* ───────────────────── 인증/권한 ───────────────────── */
function signAdmin() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' })
}

function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.token
    if (!token) return res.sendStatus(401)
    const payload = jwt.verify(token, JWT_SECRET)
    if (payload.role !== 'admin') return res.sendStatus(403)
    req.user = payload
    next()
  } catch {
    return res.sendStatus(401)
  }
}

/* ─────────────── 유틸 ─────────────── */
function toDateOrNow(v) {
  const d = v ? new Date(v) : null
  return isNaN(d?.getTime?.() ?? NaN) ? new Date() : d
}

// 텍스트 바디일 경우 JSON 파싱 헬퍼
function ensureObjectBody(body) {
  if (!body) return null
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return null
    }
  }
  return body
}

/* ─────────────── 헬스체크/디버그 ─────────────── */
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/_debug/buckets', async (_req, res) => {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ buckets: data })
})

/* ───────────────────── 인증 API ───────────────────── */
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.cookies?.token
    if (!token) return res.json({ role: 'guest' })
    const payload = jwt.verify(token, JWT_SECRET)
    return res.json({ role: payload.role === 'admin' ? 'admin' : 'guest' })
  } catch {
    return res.json({ role: 'guest' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const { password } = parsed || {}
    if (!password) return res.status(400).json({ ok: false, msg: 'no password' })

    const ok = await bcrypt.compare(password, ADMIN_HASH)
    if (!ok) return res.status(401).json({ ok: false })

    const token = signAdmin()
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 2,
      path: '/', // 전역 경로
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('login error', e)
    res.sendStatus(500)
  }
})

app.post('/api/auth/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('token', { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' })
  res.json({ ok: true })
})

/* ───────────────────── 업로드 API (Supabase Storage) ───────────────────── */
app.post('/api/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const f = req.file
    if (!f) return res.status(400).json({ error: 'no file' })

    const ext = (path.extname(f.originalname) || '').toLowerCase()
    const base = (f.originalname || 'image').replace(/[^\w.\-]+/g, '_').toLowerCase()
    const dir = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const key = `${dir}/${crypto.randomUUID()}_${base || ('file' + ext)}`

    const { error: upErr } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, f.buffer, {
      contentType: f.mimetype,
      upsert: false,
      cacheControl: '31536000',
    })
    if (upErr) {
      const msg = upErr.message || 'upload error'
      const hint = /row-level security/i.test(msg)
        ? 'Hint: SUPABASE_SERVICE_ROLE_KEY에 anon 키가 들어갔을 가능성이 큽니다. 또는 버킷 정책/이름 확인.'
        : undefined
      console.error('Supabase upload error:', msg, { bucket: SUPABASE_BUCKET, mimetype: f.mimetype, size: f.size })
      return res.status(500).json({ error: msg, hint, bucket: SUPABASE_BUCKET })
    }

    const { data: signed, error: sErr } =
      await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(key, 60 * 60 * 24 * 365)
    if (sErr) return res.status(500).json({ error: sErr.message })
    return res.json({ id: key, type: f.mimetype, url: signed.signedUrl })
  } catch (e) {
    console.error('upload error', e)
    res.status(500).json({ error: 'upload failed' })
  }
})

/* ───────────────────── 블로그 글 API (Supabase Postgres) ───────────────────── */
app.get('/api/posts', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('data, created_at')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })

    const posts = (data || []).map(r => r.data)
    return res.json(posts)
  } catch (e) {
    console.error('list posts error', e)
    res.status(500).json({ error: 'posts list failed' })
  }
})

app.get('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id
    const { data, error } = await supabase.from('posts').select('data').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'not found' })
      return res.status(500).json({ error: error.message })
    }
    return res.json(data.data)
  } catch (e) {
    console.error('get post error', e)
    res.status(500).json({ error: 'post get failed' })
  }
})

/** 생성 (body: 기존 post JSON, 반드시 post.id 포함) */
app.post('/api/posts', requireAdmin, async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const post = parsed
    if (!post || !post.id) return res.status(400).json({ error: 'invalid post' })

    const createdAt = toDateOrNow(post.createdAt)
    const { data, error } = await supabase
      .from('posts')
      .insert([{ id: post.id, data: post, created_at: createdAt.toISOString() }])
      .select('id')
      .single()
    if (error) return res.status(500).json({ error: error.message })

    res.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('create post error', e)
    res.status(500).json({ error: 'post create failed' })
  }
})

/** 수정 (body: 수정된 post JSON) */
app.put('/api/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id
    const parsed = ensureObjectBody(req.body)
    const post = { ...(parsed || {}), id }

    const { data, error } = await supabase
      .from('posts')
      .update({ data: post })
      .eq('id', id)
      .select('id')
      .single()
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'not found' })
      return res.status(500).json({ error: error.message })
    }
    res.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('update post error', e)
    res.status(500).json({ error: 'post update failed' })
  }
})

/** 삭제 */
app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ ok: true })
  } catch (e) {
    console.error('delete post error', e)
    res.status(500).json({ error: 'post delete failed' })
  }
})

/* ───────────────────── 댓글 API ───────────────────── */
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const postId = req.params.postId
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, nickname, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })

    const list = (data || []).map(c => ({
      id: c.id,
      postId: c.post_id,
      nickname: c.nickname,
      content: c.content,
      createdAt: new Date(c.created_at).toISOString(),
    }))
    res.json(list)
  } catch (e) {
    console.error('list comments error', e)
    res.status(500).json({ error: 'comments list failed' })
  }
})

app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const postId = req.params.postId
    const { nickname, password, content } = parsed || {}
    if (!nickname || !password || !content) {
      return res.status(400).json({ error: 'invalid body' })
    }

    const { error: chkErr } = await supabase.from('posts').select('id').eq('id', postId).single()
    if (chkErr) {
      if (chkErr.code === 'PGRST116') return res.status(404).json({ error: 'post not found' })
      return res.status(500).json({ error: chkErr.message })
    }

    const id = nanoid12()
    const passwordHash = await bcrypt.hash(password, 10)
    const nowIso = new Date().toISOString()

    const { error } = await supabase.from('comments').insert([
      { id, post_id: postId, nickname, content, password_hash: passwordHash, created_at: nowIso },
    ])
    if (error) return res.status(500).json({ error: error.message })

    res.json({ id })
  } catch (e) {
    console.error('create comment error', e)
    res.status(500).json({ error: 'comment create failed' })
  }
})

app.post('/api/comments/:cid/verify', async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const { password } = parsed || {}
    const cid = req.params.cid
    const { data, error } = await supabase
      .from('comments')
      .select('password_hash')
      .eq('id', cid)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ ok: false })
      return res.status(500).json({ ok: false })
    }
    const ok = await bcrypt.compare(password || '', data.password_hash || '')
    res.json({ ok })
  } catch (e) {
    console.error('verify comment error', e)
    res.status(500).json({ ok: false })
  }
})

app.put('/api/comments/:cid', async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const cid = req.params.cid
    const { content, password } = parsed || {}
    if (!content || !password) return res.status(400).json({ ok: false, msg: 'invalid body' })

    const { data: row, error: gErr } = await supabase
      .from('comments')
      .select('password_hash')
      .eq('id', cid)
      .single()
    if (gErr) {
      if (gErr.code === 'PGRST116') return res.status(404).json({ ok: false })
      return res.status(500).json({ ok: false })
    }
    const ok = await bcrypt.compare(password, row.password_hash || '')
    if (!ok) return res.status(401).json({ ok: false })

    const { error } = await supabase.from('comments').update({ content }).eq('id', cid)
    if (error) return res.status(500).json({ ok: false })

    res.json({ ok: true })
  } catch (e) {
    console.error('update comment error', e)
    res.status(500).json({ ok: false })
  }
})

app.delete('/api/comments/:cid', async (req, res) => {
  try {
    const parsed = ensureObjectBody(req.body)
    const cid = req.params.cid
    const { password } = parsed || {}

    const { data: row, error: gErr } = await supabase
      .from('comments')
      .select('password_hash')
      .eq('id', cid)
      .single()
    if (gErr) {
      if (gErr.code === 'PGRST116') return res.status(404).json({ ok: false })
      return res.status(500).json({ ok: false })
    }
    const ok = await bcrypt.compare(password || '', row.password_hash || '')
    if (!ok) return res.status(401).json({ ok: false })

    const { error } = await supabase.from('comments').delete().eq('id', cid)
    if (error) return res.status(500).json({ ok: false })

    res.json({ ok: true })
  } catch (e) {
    console.error('delete comment error', e)
    res.status(500).json({ ok: false })
  }
})

/* ───────────────────── 서버 시작 ───────────────────── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API on http://0.0.0.0:${PORT}`)
})
