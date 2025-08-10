// server.js
import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { customAlphabet } from 'nanoid'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

/* ───────────────────── CORS 설정 ───────────────────── */
const ALLOW_ORIGINS = (process.env.ALLOW_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && ALLOW_ORIGINS.includes(origin)) {
    res.header('Vary', 'Origin')
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
  }
  next()
})

app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

/* ───────────────────── 환경 변수 ───────────────────── */
const PORT = Number((process.env.PORT || 4000).toString().trim())
const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret').toString().trim()
const ADMIN_HASH = (process.env.ADMIN_HASH || '').toString().trim()

if (!ADMIN_HASH) {
  console.error('[FATAL] .env에 ADMIN_HASH가 없습니다.')
  process.exit(1)
}

/* ───────────────────── 경로/디렉터리 ───────────────────── */
const DATA_DIR = path.join(__dirname, 'data')
const POSTS_DIR = path.join(DATA_DIR, 'posts')
const COMMENTS_DIR = path.join(DATA_DIR, 'comments')
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads')

for (const d of [DATA_DIR, POSTS_DIR, COMMENTS_DIR, UPLOADS_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

// 정적 제공(업로드 파일 접근용)
app.use('/uploads', express.static(UPLOADS_DIR))

/* ───────────────────── 업로드 설정 ───────────────────── */
const nanoid10 = customAlphabet('1234567890abcdef', 10)
const nanoid12 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12) // 댓글 id
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ''
    cb(null, nanoid10() + ext.toLowerCase())
  },
})
const upload = multer({ storage })

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

/* ─────────────── 헬스체크 ─────────────── */
app.get('/api/health', (req, res) => res.json({ ok: true }))

/* ───────────────────── 인증 API ───────────────────── */
// 현재 로그인 상태
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

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body || {}
    if (!password) return res.status(400).json({ ok: false, msg: 'no password' })
    const ok = await bcrypt.compare(password, ADMIN_HASH)
    if (!ok) return res.status(401).json({ ok: false })

    const token = signAdmin()
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd, // HTTPS에서만
      maxAge: 1000 * 60 * 60 * 2,
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('login error', e)
    res.sendStatus(500)
  }
})

// 로그아웃
app.post('/api/auth/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('token', { httpOnly: true, sameSite: isProd ? 'none' : 'lax', secure: isProd })
  res.json({ ok: true })
})

/* ───────────────────── 업로드 API ───────────────────── */
app.post('/api/upload', requireAdmin, upload.single('file'), (req, res) => {
  const f = req.file
  if (!f) return res.status(400).json({ error: 'no file' })
  const url = `/uploads/${f.filename}`
  res.json({ id: f.filename, type: f.mimetype, url })
})

/* ───────────────────── 블로그 글 API ───────────────────── */
app.get('/api/posts', async (req, res) => {
  const files = await fsp.readdir(POSTS_DIR)
  const posts = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    try {
      const raw = await fsp.readFile(path.join(POSTS_DIR, file), 'utf-8')
      posts.push(JSON.parse(raw))
    } catch {}
  }
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(posts)
})

app.get('/api/posts/:id', async (req, res) => {
  const fp = path.join(POSTS_DIR, `${req.params.id}.json`)
  if (!fs.existsSync(fp)) return res.status(404).json({ error: 'not found' })
  const raw = await fsp.readFile(fp, 'utf-8')
  res.json(JSON.parse(raw))
})

app.post('/api/posts', requireAdmin, async (req, res) => {
  const post = req.body
  if (!post || !post.id) return res.status(400).json({ error: 'invalid post' })
  const fp = path.join(POSTS_DIR, `${post.id}.json`)
  await fsp.writeFile(fp, JSON.stringify(post, null, 2), 'utf-8')
  res.json({ ok: true, id: post.id })
})

app.put('/api/posts/:id', requireAdmin, async (req, res) => {
  const post = req.body
  post.id = req.params.id
  const fp = path.join(POSTS_DIR, `${post.id}.json`)
  await fsp.writeFile(fp, JSON.stringify(post, null, 2), 'utf-8')
  res.json({ ok: true, id: post.id })
})

app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  const fp = path.join(POSTS_DIR, `${req.params.id}.json`)
  if (fs.existsSync(fp)) await fsp.unlink(fp)
  res.json({ ok: true })
})

/* ───────────────────── 댓글 API ───────────────────── */
const commentPath = (cid) => path.join(COMMENTS_DIR, `${cid}.json`)

async function readComment(cid) {
  const fp = commentPath(cid)
  if (!fs.existsSync(fp)) return null
  const raw = await fsp.readFile(fp, 'utf-8')
  return JSON.parse(raw)
}
async function writeComment(obj) {
  const fp = commentPath(obj.id)
  await fsp.writeFile(fp, JSON.stringify(obj, null, 2), 'utf-8')
}
async function deleteCommentFile(cid) {
  const fp = commentPath(cid)
  if (fs.existsSync(fp)) await fsp.unlink(fp)
}

app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const postId = req.params.postId
    const files = await fsp.readdir(COMMENTS_DIR)
    const list = []
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const raw = await fsp.readFile(path.join(COMMENTS_DIR, file), 'utf-8')
        const obj = JSON.parse(raw)
        if (obj.postId === postId) {
          list.push({
            id: obj.id,
            postId: obj.postId,
            nickname: obj.nickname,
            content: obj.content,
            createdAt: obj.createdAt,
          })
        }
      } catch {}
    }
    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    res.json(list)
  } catch (e) {
    console.error('list comments error', e)
    res.status(500).json({ error: 'comments list failed' })
  }
})

app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const postId = req.params.postId
    const { nickname, password, content } = req.body || {}
    if (!nickname || !password || !content) {
      return res.status(400).json({ error: 'invalid body' })
    }
    const postFile = path.join(POSTS_DIR, `${postId}.json`)
    if (!fs.existsSync(postFile)) return res.status(404).json({ error: 'post not found' })

    const id = nanoid12()
    const now = new Date().toISOString()
    const passwordHash = await bcrypt.hash(password, 10)
    const obj = { id, postId, nickname, content, createdAt: now, passwordHash }
    await writeComment(obj)
    res.json({ id })
  } catch (e) {
    console.error('create comment error', e)
    res.status(500).json({ error: 'comment create failed' })
  }
})

app.post('/api/comments/:cid/verify', async (req, res) => {
  try {
    const { password } = req.body || {}
    const cid = req.params.cid
    const obj = await readComment(cid)
    if (!obj) return res.status(404).json({ ok: false })
    const ok = await bcrypt.compare(password || '', obj.passwordHash || '')
    res.json({ ok })
  } catch (e) {
    console.error('verify comment error', e)
    res.status(500).json({ ok: false })
  }
})

app.put('/api/comments/:cid', async (req, res) => {
  try {
    const cid = req.params.cid
    const { content, password } = req.body || {}
    if (!content || !password) return res.status(400).json({ ok: false, msg: 'invalid body' })
    const obj = await readComment(cid)
    if (!obj) return res.status(404).json({ ok: false })
    const ok = await bcrypt.compare(password, obj.passwordHash || '')
    if (!ok) return res.status(401).json({ ok: false })
    obj.content = content
    obj.updatedAt = new Date().toISOString()
    await writeComment(obj)
    res.json({ ok: true })
  } catch (e) {
    console.error('update comment error', e)
    res.status(500).json({ ok: false })
  }
})

app.delete('/api/comments/:cid', async (req, res) => {
  try {
    const cid = req.params.cid
    const { password } = req.body || {}
    const obj = await readComment(cid)
    if (!obj) return res.status(404).json({ ok: false })
    const ok = await bcrypt.compare(password || '', obj.passwordHash || '')
    if (!ok) return res.status(401).json({ ok: false })
    await deleteCommentFile(cid)
    res.json({ ok: true })
  } catch (e) {
    console.error('delete comment error', e)
    res.status(500).json({ ok: false })
  }
})

/* ───────────────────── 서버 시작 (딱 한 번, 맨 마지막) ───────────────────── */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API on http://0.0.0.0:${PORT}`)
})
