'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/loading';
import { useMyReviewStats } from '@/lib/api-hooks';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  FileText,
  User,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

function ReviewerQuickStats() {
  const { data: stats, isLoading: loadingStats } = useMyReviewStats();
  
  if (loadingStats) return <div className="py-4"><Spinner /></div>;
  
  const pending = 12;
  const myAssigned = 3;
  const todayDone = 5;
  const weekDone = 48;
  
  const statsData = [
    {
      title: '待审核',
      value: pending,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-200',
      description: '等待处理的申请'
    },
    {
      title: '我的占用',
      value: myAssigned,
      icon: ClipboardCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-200',
      description: '正在审核中'
    },
    {
      title: '今日完成',
      value: todayDone,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-200',
      description: '今日已处理'
    },
    {
      title: '本周完成',
      value: weekDone,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-200',
      description: '本周累计处理'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`border ${stat.borderColor} bg-white/80 backdrop-blur-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-stone-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CurrentTasks() {
  const tasks = [
    {
      id: 1,
      candidate: '张三',
      position: '软件工程师初级',
      stage: '初审',
      status: '进行中',
      timeLeft: '25分钟',
      priority: 'high',
      color: 'bg-amber-50 border-amber-200',
      badge: 'bg-amber-100 text-amber-700'
    },
    {
      id: 2,
      candidate: '李四',
      position: '数据分析师中级',
      stage: '复审',
      status: '等待材料',
      timeLeft: '-',
      priority: 'medium',
      color: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-700'
    }
  ];

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-amber-600" />
            我的当前任务
          </CardTitle>
          <Button variant="outline" size="sm" className="border-stone-300 text-stone-600 hover:bg-stone-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-stone-300" />
            <p>暂无进行中的任务</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 rounded-lg border ${task.color} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-stone-900">{task.candidate}</h3>
                    <Badge className={task.badge}>{task.priority === 'high' ? '高优先' : '中优先'}</Badge>
                  </div>
                  <p className="text-sm text-stone-600">{task.position}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {task.stage}阶段
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.timeLeft !== '-' ? `剩余 ${task.timeLeft}` : task.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700"
                    asChild
                  >
                    <Link href={`/reviewer/review/${task.id}`}>
                      继续审核
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="border-stone-300 text-stone-600 hover:bg-white">
                    释放任务
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PendingQueue() {
  const queue = [
    {
      id: 1,
      candidate: '王五',
      position: '产品经理高级',
      stage: '初审',
      submittedAt: '2024-01-15 16:20',
      priority: 'high',
      time: '2小时前'
    },
    {
      id: 2,
      candidate: '赵六',
      position: 'UI设计师中级',
      stage: '初审',
      submittedAt: '2024-01-15 15:45',
      priority: 'medium',
      time: '3小时前'
    },
    {
      id: 3,
      candidate: '孙七',
      position: '测试工程师初级',
      stage: '复审',
      submittedAt: '2024-01-15 14:30',
      priority: 'low',
      time: '4小时前'
    }
  ];

  const priorityConfig = {
    high: { label: '高', color: 'bg-red-100 text-red-700 border-red-200' },
    medium: { label: '中', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: '低', color: 'bg-stone-100 text-stone-700 border-stone-200' }
  };

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            待审核队列
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-800">
            查看全部
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.map((item) => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-stone-900">{item.candidate}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${priorityConfig[item.priority as keyof typeof priorityConfig].color}`}>
                  {priorityConfig[item.priority as keyof typeof priorityConfig].label}优先
                </span>
              </div>
              <p className="text-sm text-stone-500">{item.position}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                <span>{item.stage}阶段</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700"
              asChild
            >
              <Link href={`/reviewer/review/${item.id}`}>
                开始审核
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      icon: RefreshCw,
      title: '刷新队列',
      description: '获取最新审核任务',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: '审核统计',
      description: '查看审核数据',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: ClipboardCheck,
      title: '审核设置',
      description: '配置审核偏好',
      color: 'from-violet-500 to-purple-500'
    }
  ];

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-stone-800">快速操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                className="p-4 text-left border border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-md transition-all bg-white group"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-medium text-stone-900 mb-1">{action.title}</h3>
                <p className="text-sm text-stone-500">{action.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewerDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">审核工作台</h1>
          <p className="text-stone-500 mt-1">管理您的审核任务和队列</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-stone-300 text-stone-600">
            <Clock className="h-3 w-3 mr-1" />
            工作时间: 9:00 - 18:00
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <ReviewerQuickStats />

      {/* Current Tasks & Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CurrentTasks />
        <PendingQueue />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
