// bor_app_frontend/src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // Assuming your home page is at '/'
    // If using react-router, you might want to use useNavigate hook if this component
    // can be wrapped in a Router, but ErrorBoundaries are often outside.
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="应用发生了一些错误"
          subTitle="很抱歉，应用遇到了一些未预期的技术问题。请尝试刷新页面或返回首页。"
          extra={[
            <Button type="primary" key="refresh" onClick={this.handleRefresh}>
              刷新页面
            </Button>,
            <Button key="home" onClick={this.handleGoHome}>
              返回首页
            </Button>,
          ]}
        >
          {/* You can optionally display error details in development */}
          {import.meta.env.DEV && (
            <div style={{ textAlign: 'left', marginTop: 20, background: '#fff0f0', padding: 15 }}>
              <details>
                <summary style={{ cursor: 'pointer' }}>错误详情 (仅开发模式可见)</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
