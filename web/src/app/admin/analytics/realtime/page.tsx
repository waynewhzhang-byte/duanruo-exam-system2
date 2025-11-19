/**
 * Real-time Analytics Dashboard - Long-term implementation
 * Live monitoring, alerts, and predictive analytics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  SystemStatusMonitor,
  LiveActivityFeed,
  PerformanceMetrics
} from '@/components/analytics/RealTimeMonitor'
import { 
  Activity, 
  Bell, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Server,
  Database,
  Zap,
  Eye,
  Settings,
  Play,
  Pause
} from 'lucide-react'

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

interface PredictionData {
  metric: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
}

export default function RealTimeAnalyticsPage() {
  const [isMonitoring, setIsMonitoring] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [liveStats, setLiveStats] = useState({
    activeUsers: 0,
    requestsPerSecond: 0,
    averageResponseTime: 0,
    errorRate: 0
  })

  // Simulate real-time data updates
  useEffect(() => {
    if (!isMonitoring) return

    const interval = setInterval(() => {
      // Update live stats
      setLiveStats({
        activeUsers: Math.floor(Math.random() * 500) + 100,
        requestsPerSecond: Math.floor(Math.random() * 100) + 20,
        averageResponseTime: Math.floor(Math.random() * 200) + 50,
        errorRate: Math.random() * 2
      })

      // Generate random alerts
      if (Math.random() < 0.1) { // 10% chance of new alert
        const alertTypes: Alert['type'][] = ['warning', 'error', 'info']
        const alertMessages = [
          { title: '高CPU使用率', message: 'CPU使用率超过80%' },
          { title: '内存不足', message: '可用内存低于20%' },
          { title: '响应时间异常', message: '平均响应时间超过500ms' },
          { title: '错误率上升', message: '错误率超过5%' },
          { title: '存储空间警告', message: '磁盘使用率超过85%' }
        ]

        const randomAlert = alertMessages[Math.floor(Math.random() * alertMessages.length)]
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          title: randomAlert.title,
          message: randomAlert.message,
          timestamp: new Date(),
          acknowledged: false
        }

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]) // Keep only latest 10
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isMonitoring])

  // Generate predictions
  useEffect(() => {
    const generatePredictions = () => {
      const metrics = [
        { metric: '申请量', current: 1250, base: 1250 },
        { metric: '收入', current: 85000, base: 85000 },
        { metric: '用户增长', current: 320, base: 320 },
        { metric: '系统负载', current: 65, base: 65 }
      ]

      const newPredictions = metrics.map(({ metric, current, base }) => {
        const change = (Math.random() - 0.5) * 0.4 // ±20% change
        const predicted = Math.floor(base * (1 + change))
        const confidence = Math.floor(Math.random() * 30) + 70 // 70-100%
        const trend = predicted > current ? 'up' : predicted < current ? 'down' : 'stable'

        return {
          metric,
          current,
          predicted,
          confidence,
          trend: trend as 'up' | 'down' | 'stable'
        }
      })

      setPredictions(newPredictions)
    }

    generatePredictions()
    const interval = setInterval(generatePredictions, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ))
  }

  const clearAllAlerts = () => {
    setAlerts([])
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getTrendIcon = (trend: PredictionData['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
            <p className="text-gray-600">系统实时状态监控与预测分析</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant={isMonitoring ? "default" : "outline"}
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isMonitoring ? '暂停监控' : '开始监控'}
            </Button>
            
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              监控设置
            </Button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">在线用户</p>
                  <p className="text-2xl font-bold">{liveStats.activeUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">请求/秒</p>
                  <p className="text-2xl font-bold">{liveStats.requestsPerSecond}</p>
                </div>
                <Zap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">响应时间</p>
                  <p className="text-2xl font-bold">{liveStats.averageResponseTime}ms</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">错误率</p>
                  <p className="text-2xl font-bold">{liveStats.errorRate.toFixed(2)}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Monitoring Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status - spans 2 columns */}
          <div className="lg:col-span-2">
            <SystemStatusMonitor />
          </div>

          {/* Performance Metrics */}
          <div>
            <PerformanceMetrics />
          </div>
        </div>

        {/* Alerts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Panel */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  系统警报
                  {alerts.filter(a => !a.acknowledged).length > 0 && (
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      {alerts.filter(a => !a.acknowledged).length}
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearAllAlerts}>
                  清除全部
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>暂无警报</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${
                        alert.acknowledged ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs mt-2 opacity-75">
                            {alert.timestamp.toLocaleString()}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            确认
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Activity Feed */}
          <LiveActivityFeed />
        </div>

        {/* Predictive Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              预测分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {predictions.map((prediction) => (
                <div key={prediction.metric} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{prediction.metric}</h4>
                    {getTrendIcon(prediction.trend)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">当前:</span>
                      <span className="font-medium">{prediction.current.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">预测:</span>
                      <span className={`font-medium ${
                        prediction.trend === 'up' ? 'text-green-600' : 
                        prediction.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {prediction.predicted.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">置信度:</span>
                      <span className="font-medium">{prediction.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-blue-500"
                        style={{ width: `${prediction.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="justify-start">
                <Eye className="h-4 w-4 mr-2" />
                查看日志
              </Button>
              <Button variant="outline" className="justify-start">
                <Server className="h-4 w-4 mr-2" />
                服务器状态
              </Button>
              <Button variant="outline" className="justify-start">
                <Database className="h-4 w-4 mr-2" />
                数据库监控
              </Button>
              <Button variant="outline" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                监控配置
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
