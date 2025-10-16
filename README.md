# 블로그

링크
https://leegaeulblog.onrender.com

## 구조
render.com으로 배포, 데이터베이스는 supabase 이용

## 개발 환경 설정

### 1. 환경 변수 설정
`.env` 파일에 다음 변수들을 설정하세요:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_HASH=your_admin_password_hash
JWT_SECRET=your_jwt_secret
```

### 2. 정적 데이터 생성
```bash
cd server
npm run generate-static
```

## API 엔드포인트

### 기존 테이블 구조 활용
- `posts` - 블로그 포스트 데이터
- `comments` - 블로그 포스트 댓글
- `threads_comments` - 갤러리/모델/티어리스트 댓글
- `threads_reviews` - 갤러리/모델/티어리스트 리뷰/한줄평
- `anime_titles` - 애니메이션 제목 관리

### 정적 파일 시스템
이 시스템은 Supabase에서 데이터를 가져와 정적 파일을 생성하고, 방문자에게는 정적 파일을 제공하는 방식으로 구성됩니다.

#### 정적 파일 생성
- **전체 데이터**: `npm run generate-static` - 모든 데이터를 정적 파일로 생성
- **개별 스레드**: 각 `thread_key`별로 개별 JSON 파일 생성
- **파일 위치**: `client/public/threads/` 디렉토리
- **파일명**: `thread_key`를 안전한 파일명으로 변환 (예: `스크린샷_2025-10-05_225635-CMVkus54.png.json`)

#### 정적 파일 제공 API
- **개별 스레드 데이터**: `GET /api/threads/:key` - 정적 파일 우선, 없으면 DB에서 조회
- **정적 파일 직접 제공**: `GET /static/threads/:filename` - 긴 캐시 설정으로 최적화

#### 자동 갱신 조건
- **블로그 포스트**: 생성/수정/삭제 시 `posts.json`, `tierlist.json` 재생성
- **스레드 데이터**: 리뷰/제목/댓글 수정 시 해당 `thread_key`의 개별 파일 재생성
- **티어리스트**: 이미지 파일명 형태의 `thread_key` 수정 시 전체 티어리스트 재생성

### 데이터베이스 스키마
- `thread_key`: 파일명 (예: `스크린샷 2025-10-05 225635-CMVkus54.png`)
- `anime_titles.title`: 애니메이션 제목
- `threads_reviews.rating`: 티어 등급 (0=S, 1=A, 2=B, 3=C, 4=D, 5=F)
- `threads_reviews.text`: 한줄평
- `threads_comments`: 댓글 목록

### 성능 최적화
- **정적 파일 캐싱**: `Cache-Control: public, max-age=3600, immutable`
- **API 캐싱**: `Cache-Control: public, max-age=300, stale-while-revalidate=600`
- **백그라운드 재생성**: 데이터 변경 시 비동기적으로 정적 파일 업데이트