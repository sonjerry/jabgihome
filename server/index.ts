// server/index.ts
// 실행 전: npm i express cookie-parser jsonwebtoken bcryptjs express-rate-limit helmet csurf multer sharp nanoid cors dotenv
// 타입:     npm i -D @types/express @types/cookie-parser @types/jsonwebtoken @types/bcryptjs @types/multer

import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import type { RequestHandler } from 'express'
import csurf from 'csurf'
import multer from 'multer'
import sharp from 'sharp'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'
import cors from 'cors'

/* ──────────────────────────────────────────────────────────────────────
   기본 설정
   ────────────────────────────────────────────────────────────────────── */
const app = express()

// ✨ CORS 수동 셋업 (cookieParser보다 먼저!)
const ALLOW_ORIGIN = 'http://localhost:5173';
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === ALLOW_ORIGIN) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin'); // 캐시 분리
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 기존 cors 미들웨어는 주석 처리 또는 삭제하세요!
// app.use(cors({
//   origin: 'http://localhost:5173',
//   credentials: true, // 쿠키 허용
// }))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

/* ──────────────────────────────────────────────────────────────────────
   환경 변수
   ────────────────────────────────────────────────────────────────────── */
const PORT = Number(process.env.PORT || 4000) // ← 기본값 4000으로
const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_HASH = process.env.ADMIN_HASH

if (!JWT_SECRET || !ADMIN_HASH) {
  console.error('[FATAL] .env에 JWT_SECRET / ADMIN_HASH가 필요합니다.')
  process.exit(1)
}

/* ──────────────────────────────────────────────────────────────────────
   인증 & 권한
   ────────────────────────────────────────────────────────────────────── */
const loginLimiter = rateLimit({ windowMs: 60_000, max: 5 }) // 로그인 5회/분

function signAdmin() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET!, { expiresIn: '2h' })
}

const requireAdmin: express.RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies.token
    if (!token) return res.sendStatus(401)
    const payload = jwt.verify(token, JWT_SECRET!) as any
    if (payload.role !== 'admin') return res.sendStatus(403)
    ;(req as any).user = payload
    next()
  } catch {
    return res.sendStatus(401)
  }
}

// CSRF (로컬 개발만 하실 거면 꺼도 됩니다. 배포 시 켜세요.)
const csrfProtection = csurf({
  cookie: { httpOnly: true, sameSite: 'strict', secure: false },
}) as unknown as RequestHandler

/* ──────────────────────────────────────────────────────────────────────
   로그인 / 로그아웃 / 로그인 상태
   ────────────────────────────────────────────────────────────────────── */
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { password } = req.body || {}
  if (!password) return res.status(400).json({ ok: false })
  const ok = await bcrypt.compare(password, ADMIN_HASH!)
  if (!ok) return res.status(401).json({ ok: false })

  const token = signAdmin()
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',  // localhost:5173 ↔ 4000 같은 사이트로 간주됨
    secure: false,    // 로컬 http 이므로 false (https면 true)
    maxAge: 1000 * 60 * 60 * 2
  })
  res.json({ ok: true })
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false })
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.cookies.token
    if (!token) return res.json({ role: 'guest' })
    const payload: any = jwt.verify(token, JWT_SECRET!)
    return res.json({ role: payload.role === 'admin' ? 'admin' : 'guest' })
  } catch {
    return res.json({ role: 'guest' })
  }
})

// (옵션) CSRF 토큰 발급 — 로컬에선 생략 가능
app.get('/api/auth/csrf', csrfProtection, (req, res) => {
  res.json({ ok: true })
})

/* ──────────────────────────────────────────────────────────────────────
   업로드 저장소 (비공개 경로) + 인덱스
   ────────────────────────────────────────────────────────────────────── */
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads')
const IMAGE_DIR = path.join(UPLOAD_ROOT, 'images')
const INDEX_FILE = path.join(IMAGE_DIR, '_index.json')

async function ensureDirs() {
  await fsp.mkdir(IMAGE_DIR, { recursive: true })
  try { await fsp.access(INDEX_FILE) }
  catch { await fsp.writeFile(INDEX_FILE, JSON.stringify({}), 'utf8') }
}
function readIndex(): Promise<Record<string, { path: string; mime: string }>> {
  return fsp.readFile(INDEX_FILE, 'utf8').then((t) => (t ? JSON.parse(t) : {}))
}
function writeIndex(map: Record<string, { path: string; mime: string }>) {
  return fsp.writeFile(INDEX_FILE, JSON.stringify(map), 'utf8')
}
ensureDirs().catch((e) => {
  console.error('[FATAL] 업로드 디렉터리 준비 실패:', e)
  process.exit(1)
})

/* ──────────────────────────────────────────────────────────────────────
   multer (메모리) + 이미지 리인코딩(sharp) + 무작위 파일명
   ────────────────────────────────────────────────────────────────────── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'].includes(file.mimetype)
    if (allowed) cb(null, true)
    else cb(null, false) // (또는 cb(new Error('Invalid file type')) )
  },
})

app.post(
  '/api/uploads/image',
  requireAdmin,
  // csrfProtection, // 로컬이면 생략 가능, 배포 시 활성
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ ok: false, msg: 'no file' })

      const id = nanoid(16)
      const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg'
      const outPath = path.join(IMAGE_DIR, `${id}.${ext}`)

      // EXIF 제거 + 표준화(원본 파일명/메타 숨김)
      let buffer = req.file.buffer
      if (ext === 'jpg') {
        buffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
      } else {
        buffer = await sharp(buffer).png({ compressionLevel: 9 }).toBuffer()
      }
      await fsp.writeFile(outPath, buffer)

      const map = await readIndex()
      map[id] = { path: outPath, mime: req.file.mimetype }
      await writeIndex(map)

      res.json({ ok: true, id, url: `/img/${id}` }) // 원본 파일명 노출 없음
    } catch (e) {
      console.error('upload error:', e)
      res.sendStatus(500)
    }
  }
)

/* ──────────────────────────────────────────────────────────────────────
   이미지 제공 (정적 공개 금지, 라우트로만 접근)
   ────────────────────────────────────────────────────────────────────── */
app.get('/img/:id', async (req, res) => {
  try {
    const id = req.params.id
    const map = await readIndex()
    const rec = map[id]
    if (!rec) return res.sendStatus(404)

    res.setHeader('Content-Type', rec.mime)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Disposition', 'inline; filename="image"') // 파일명 비노출

    const stream = fs.createReadStream(rec.path)
    stream.on('error', () => res.sendStatus(404))
    stream.pipe(res)
  } catch (e) {
    console.error('serve image error:', e)
    res.sendStatus(500)
  }
})

/* ──────────────────────────────────────────────────────────────────────
   글 API (변경 라우트는 반드시 보호)
   ────────────────────────────────────────────────────────────────────── */
app.post('/api/posts', requireAdmin, (req, res) => res.json({ ok: true }))
app.put('/api/posts/:id', requireAdmin, (req, res) => res.json({ ok: true }))
app.delete('/api/posts/:id', requireAdmin, (req, res) => res.json({ ok: true }))

/* ──────────────────────────────────────────────────────────────────────
   서버 시작 (로컬 전용 바인딩)
   ────────────────────────────────────────────────────────────────────── */
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Admin server on http://127.0.0.1:${PORT}`)
})
