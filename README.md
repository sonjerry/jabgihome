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

### 정적 파일 갱신 조건
- 블로그 포스트 생성/수정/삭제 시
- 티어리스트 관련 리뷰/제목 수정 시 (파일명 형태의 `thread_key` 사용)
- 수동 실행: `npm run generate-static`

### 티어리스트 데이터 구조
- `thread_key`: 파일명 (예: `스크린샷 2025-10-05 225635-CMVkus54.png`)
- `anime_titles.title`: 애니메이션 제목
- `threads_reviews.rating`: 티어 등급 (0=S, 1=A, 2=B, 3=C, 4=D, 5=F)
- `threads_reviews.text`: 한줄평
- `threads_comments`: 댓글 목록