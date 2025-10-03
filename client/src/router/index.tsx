// client/src/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './Layout'
import RequireAdmin from './RequireAdmin'

// 페이지 컴포넌트들을 lazy loading
const Home = lazy(() => import('../pages/Home'))
const Blog = lazy(() => import('../pages/Blog'))
const PostDetail = lazy(() => import('../pages/PostDetail'))
const Gallery = lazy(() => import('../pages/Gallery'))
const ModelGallery = lazy(() => import('../pages/ModelGallery'))
const Editor = lazy(() => import('../pages/Editor'))
const Projects = lazy(() => import('../pages/Projects'))
const NotFound = lazy(() => import('../pages/NotFound'))

// 로딩 컴포넌트
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-white/70 text-sm">로딩중...</div>
  </div>
)

// 페이지 래퍼 컴포넌트
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <NotFoundBoundary>{children}</NotFoundBoundary>
  </Suspense>
)

// ErrorBoundary 대체: NotFound만 그대로 사용하던 기존 구조를 복구
const NotFoundBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>

// 레거시 리다이렉트 컴포넌트들
const LegacyPostRedirect = () => {
  const id = window.location.pathname.split('/').pop()
  return <Navigate to={`/blog/${id || ''}`} replace />
}

const LegacyProjectRedirect = () => (
  <Navigate to="/projects" replace />
)

// 라우터 설정
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <PageWrapper><NotFound /></PageWrapper>,
    children: [
      {
        index: true,
        element: <PageWrapper><Home /></PageWrapper>
      },
      {
        path: 'blog',
        children: [
          {
            index: true,
            element: <PageWrapper><Blog /></PageWrapper>
          },
          {
            path: 'new',
            element: (
              <RequireAdmin>
                <PageWrapper><Editor /></PageWrapper>
              </RequireAdmin>
            )
          },
          {
            path: ':id',
            element: <PageWrapper><PostDetail /></PageWrapper>
          }
        ]
      },
      {
        path: 'gallery',
        element: <PageWrapper><Gallery /></PageWrapper>
      },
      {
        path: 'modelgallery',
        element: <PageWrapper><ModelGallery /></PageWrapper>
      },
      {
        path: 'projects',
        element: <PageWrapper><Projects /></PageWrapper>
      },
      {
        path: 'editor',
        element: (
          <RequireAdmin>
            <PageWrapper><Editor /></PageWrapper>
          </RequireAdmin>
        )
      },
      // 레거시 리다이렉트
      {
        path: 'post/:id',
        element: <LegacyPostRedirect />
      },
      {
        path: 'project',
        element: <LegacyProjectRedirect />
      },
      {
        path: 'home',
        element: <Navigate to="/" replace />
      },
      // 404 처리
      {
        path: '*',
        element: <PageWrapper><NotFound /></PageWrapper>
      }
    ]
  }
])
