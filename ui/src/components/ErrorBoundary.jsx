import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h1 className="error-boundary__title">문제가 발생했습니다</h1>
          <p className="error-boundary__text">
            화면을 불러오는 중 오류가 났습니다. 페이지를 새로고침해 주세요.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
