import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">端</span>
            </div>
            <h1 className="ml-4 text-4xl font-bold text-gray-900">
              端若数智考盟
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            智能化招聘考试报名与管理平台
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card card-hover">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">候选人门户</h3>
              <p className="text-gray-600 mb-4">在线报名、上传材料、查看进度、下载准考证</p>
              <Link href="/login?role=candidate" className="btn btn-primary">
                候选人登录
              </Link>
            </div>
          </div>

          <div className="card card-hover">
            <div className="text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-warning-600 text-xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">审核员工作台</h3>
              <p className="text-gray-600 mb-4">处理审核队列、查看申请详情、做出审核决策</p>
              <Link href="/login?role=reviewer" className="btn btn-primary">
                审核员登录
              </Link>
            </div>
          </div>

          <div className="card card-hover">
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-success-600 text-xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">管理员后台</h3>
              <p className="text-gray-600 mb-4">考试管理、岗位配置、规则设置、数据分析</p>
              <Link href="/login?role=admin" className="btn btn-primary">
                管理员登录
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">平台特色</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🤖 智能审核引擎</h3>
              <p className="text-gray-600">基于规则的自动审核，提高审核效率，减少人工工作量</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📊 实时数据分析</h3>
              <p className="text-gray-600">全面的报名数据统计与分析，支持决策制定</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🔒 安全可靠</h3>
              <p className="text-gray-600">多层次权限控制，完整的审计日志，保障数据安全</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📱 移动友好</h3>
              <p className="text-gray-600">响应式设计，支持多设备访问，随时随地处理业务</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
