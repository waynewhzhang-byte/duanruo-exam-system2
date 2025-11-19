import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ClipboardCheck, Settings, Sparkles, BarChart3, Shield, Smartphone } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">端</span>
            </div>
            <h1 className="ml-4 text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              端若数智考盟
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            智能化招聘考试报名与管理平台
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>候选人门户</CardTitle>
              <CardDescription>在线报名、上传材料、查看进度、下载准考证</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login?role=candidate">候选人登录</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>审核员工作台</CardTitle>
              <CardDescription>处理审核队列、查看申请详情、做出审核决策</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login?role=reviewer">审核员登录</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>管理员后台</CardTitle>
              <CardDescription>考试管理、岗位配置、规则设置、数据分析</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login?role=admin">管理员登录</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">平台特色</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">智能审核引擎</h3>
                  <p className="text-sm text-muted-foreground">基于规则的自动审核，提高审核效率，减少人工工作量</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">实时数据分析</h3>
                  <p className="text-sm text-muted-foreground">全面的报名数据统计与分析，支持决策制定</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">安全可靠</h3>
                  <p className="text-sm text-muted-foreground">多层次权限控制，完整的审计日志，保障数据安全</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">移动友好</h3>
                  <p className="text-sm text-muted-foreground">响应式设计，支持多设备访问，随时随地处理业务</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
