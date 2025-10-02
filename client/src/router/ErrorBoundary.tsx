// client/src/router/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('페이지 에러:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-white mb-4">
              페이지 로딩 중 오류가 발생했습니다
            </h1>
            <p className="text-white/70 mb-6">
              잠시 후 다시 시도해주세요.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="block w-full px-4 py-2 bg-white/10 hover:bg-white/20 
                         border border-white/20 rounded-lg transition-colors"
              >
                다시 시도
              </button>
              <Link
                to="/"
                className="block w-full px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 
                         border border-amber-500/30 rounded-lg transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-red-400 mb-2">
                  개발자 정보
                </summary>
                <pre className="text-xs text-red-300 bg-red-900/20 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
