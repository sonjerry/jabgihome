# DJ Blog — Fullstack (Real Folder Storage)
## 구조
- `server/` (Express): 실제 디스크에 저장
  - 글: `server/data/posts/{id}.json`
  - 업로드: `server/public/uploads/*` (정적 제공: `http://localhost:4000/uploads/...`)
- `client/` (Vite + React + Tailwind): 프런트엔드

## 실행
### 1) 서버
```
cd server
npm i
npm run dev
```
→ http://localhost:4000

### 2) 클라이언트
```
cd client
npm i
npm run dev
```
→ http://localhost:5173 (프록시로 `/api`, `/uploads`가 서버로 연결)

## 사용법
- 에디터에서 파일 첨부 시 `/api/upload`로 업로드 → 첨부 URL을 받아 글에 저장
- 글 저장 시 `/api/posts`로 JSON 저장 → 서버 `data/posts/*.json` 생성
- 갤러리 이미지는 `client/public/images/`에 넣으면 바로 표시

## 참고
- 배포 시: 서버(Express) 호스팅 + 클라이언트 정적 배포 필요
