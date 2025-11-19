'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的JavaScript错误，记录错误并显示备用UI
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以便下一次渲染能够显示降级后的UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 这里可以添加错误上报逻辑
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl">出错了</CardTitle>
                  <CardDescription>
                    应用程序遇到了一个错误，我们正在努力修复
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="text-sm font-semibold text-gray-900 mb-2">错误信息：</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="bg-gray-100 p-4 rounded-md">
                  <summary className="text-sm font-semibold text-gray-900 cursor-pointer mb-2">
                    错误堆栈（开发模式）
                  </summary>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-64 mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>建议：</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>尝试刷新页面</li>
                  <li>清除浏览器缓存</li>
                  <li>如果问题持续存在，请联系技术支持</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                重试
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                返回首页
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

