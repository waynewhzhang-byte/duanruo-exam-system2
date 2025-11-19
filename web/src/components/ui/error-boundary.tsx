'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 发送错误报告到服务器
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // 发送到错误报告API
      await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error } = this.state;
    const subject = `错误报告: ${error?.message}`;
    const body = `
描述问题:
${error?.message}

错误堆栈:
${error?.stack}

浏览器信息:
${navigator.userAgent}

页面地址:
${window.location.href}

时间:
${new Date().toLocaleString('zh-CN')}
    `;
    
    const mailtoUrl = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                出现了一些问题
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                很抱歉，页面遇到了意外错误。我们已经记录了这个问题，请稍后重试。
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    错误详情 (开发模式)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>错误消息:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
                    </div>
                    <div>
                      <strong>错误堆栈:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  重试
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  返回首页
                </Button>
                <Button variant="outline" onClick={this.handleReportBug} className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  报告问题
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                如果问题持续存在，请联系技术支持或通过上方按钮报告问题。
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误边界Hook版本
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;