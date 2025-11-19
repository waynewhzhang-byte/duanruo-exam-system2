/**
 * Real-time monitoring components - Long-term implementation
 * Live data updates and system monitoring
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/loading'
import { 
  Activity, 
  Users, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useSystemPerformance } from '@/lib/analytics-hooks'

// Real-time system status component
export function SystemStatusMonitor() {
  const { data: performance, isLoading, error } = useSystemPerformance()
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'success'
    if (value >= thresholds.warning) return 'warning'
    return 'danger'
  }

  const getStatusIcon = (status: 'success' | 'warning' | 'danger') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            系统状态监控
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            系统状态监控
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <XCircle className="h-12 w-12 mx-auto mb-2" />
            <p>无法获取系统状态</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const uptimeStatus = getStatusColor(performance.uptime, { good: 99.9, warning: 99.0 })
  const responseTimeStatus = getStatusColor(
    performance.averageResponseTime <= 200 ? 100 : performance.averageResponseTime <= 500 ? 80 : 50,
    { good: 90, warning: 70 }
  )
  const errorRateStatus = getStatusColor(
    performance.errorRate <= 0.1 ? 100 : performance.errorRate <= 1 ? 80 : 50,
    { good: 90, warning: 70 }
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            系统状态监控
          </CardTitle>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* System Uptime */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(uptimeStatus)}
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">系统可用性</div>
                <div className="text-lg font-bold">{performance.uptime.toFixed(2)}%</div>
              </div>
            </div>
            <Server className="h-8 w-8 text-gray-400" />
          </div>

          {/* Response Time */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(responseTimeStatus)}
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">响应时间</div>
                <div className="text-lg font-bold">{performance.averageResponseTime}ms</div>
              </div>
            </div>
            <Wifi className="h-8 w-8 text-gray-400" />
          </div>

          {/* Error Rate */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {getStatusIcon(errorRateStatus)}
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">错误率</div>
                <div className="text-lg font-bold">{performance.errorRate.toFixed(2)}%</div>
              </div>
            </div>
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>

          {/* Active Users */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">在线用户</div>
                <div className="text-lg font-bold">{performance.activeUsers}</div>
              </div>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        {/* Storage Usage */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900">存储使用情况</span>
            <span className="text-sm text-gray-500">
              {(performance.storageUsage.used / 1024 / 1024 / 1024).toFixed(1)} GB / 
              {(performance.storageUsage.total / 1024 / 1024 / 1024).toFixed(1)} GB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                performance.storageUsage.percentage < 70 ? 'bg-green-500' :
                performance.storageUsage.percentage < 85 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${performance.storageUsage.percentage}%` }}
            ></div>
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">
            {performance.storageUsage.percentage.toFixed(1)}% 已使用
          </div>
        </div>

        {/* Peak Concurrent Users */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">峰值并发用户</span>
            <span className="text-lg font-bold text-blue-600">{performance.peakConcurrentUsers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Live activity feed component
interface ActivityItem {
  id: string
  type: 'application' | 'payment' | 'review' | 'system'
  message: string
  timestamp: Date
  severity: 'info' | 'warning' | 'error' | 'success'
}

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate real-time activity feed
    const generateActivity = (): ActivityItem => {
      const types: ActivityItem['type'][] = ['application', 'payment', 'review', 'system']
      const severities: ActivityItem['severity'][] = ['info', 'warning', 'error', 'success']
      const messages = {
        application: ['新申请提交', '申请被审核', '申请状态更新'],
        payment: ['支付成功', '支付失败', '退款处理'],
        review: ['审核完成', '审核分配', '审核超时'],
        system: ['系统备份', '数据同步', '性能警告']
      }

      const type = types[Math.floor(Math.random() * types.length)]
      const severity = severities[Math.floor(Math.random() * severities.length)]
      const message = messages[type][Math.floor(Math.random() * messages[type].length)]

      return {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
        severity
      }
    }

    // Simulate connection
    setIsConnected(true)

    const interval = setInterval(() => {
      const newActivity = generateActivity()
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]) // Keep only latest 20
    }, 3000)

    return () => {
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application':
        return '📝'
      case 'payment':
        return '💰'
      case 'review':
        return '👁️'
      case 'system':
        return '⚙️'
    }
  }

  const getSeverityColor = (severity: ActivityItem['severity']) => {
    switch (severity) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            实时活动
          </CardTitle>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>等待活动数据...</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.message}
                    </p>
                    <Badge className={getSeverityColor(activity.severity)}>
                      {activity.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Performance metrics component
export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 23
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getMetricColor = (value: number) => {
    if (value < 50) return 'bg-green-500'
    if (value < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="h-5 w-5 mr-2" />
          性能指标
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key === 'cpu' ? 'CPU' : 
                   key === 'memory' ? '内存' : 
                   key === 'disk' ? '磁盘' : '网络'}
                </span>
                <span className="text-sm text-gray-500">{value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getMetricColor(value)}`}
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

