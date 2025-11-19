'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Eye } from 'lucide-react'
import FormBuilder from '@/components/admin/form-builder/FormBuilder'
import { FormTemplate } from '@/types/form-template'
import { BASIC_TEMPLATE } from '@/data/form-templates'
import { toast } from 'sonner'

interface ExamApplicationFormProps {
  examId: string
}

export default function ExamApplicationForm({ examId }: Readonly<ExamApplicationFormProps>) {
  const [activeView, setActiveView] = useState<'builder' | 'info'>('builder')

  const handleSaveTemplate = async (template: FormTemplate) => {
    // TODO: 调用 API 保存表单模板
    console.log('Saving template:', template)
    // 这里应该调用后端 API 保存模板
    // await apiPut(`/exams/${examId}/form-template`, { templateJson: JSON.stringify(template) })
    toast.success('表单模板保存成功')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>报名表单配置</CardTitle>
              <CardDescription>使用可视化设计器配置候选人报名表单</CardDescription>
            </div>
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
              <TabsList>
                <TabsTrigger value="builder">
                  <Settings className="h-4 w-4 mr-2" />
                  表单设计器
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Eye className="h-4 w-4 mr-2" />
                  使用说明
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {activeView === 'builder' ? (
        <FormBuilder
          examId={examId}
          initialTemplate={BASIC_TEMPLATE}
          onSave={handleSaveTemplate}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>表单设计器使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">功能特点</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>可视化拖拽设计，无需编写代码</li>
                <li>支持多种字段类型：文本、数字、日期、选择、文件上传等</li>
                <li>灵活的分区管理，可折叠、可排序</li>
                <li>字段属性配置：必填、默认值、验证规则等</li>
                <li>实时预览，所见即所得</li>
                <li>支持条件显示，根据其他字段值动态显示/隐藏</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">使用步骤</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>点击"添加分区"创建表单分区</li>
                <li>从左侧字段库选择需要的字段类型</li>
                <li>点击字段添加到选中的分区</li>
                <li>在右侧配置面板设置字段属性</li>
                <li>切换到"预览"标签查看实际效果</li>
                <li>点击"保存模板"保存配置</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">字段类型说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">基础字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>单行文本：姓名、地址等短文本</li>
                    <li>多行文本：自我介绍、备注等长文本</li>
                    <li>数字：年龄、分数等数值</li>
                    <li>邮箱：电子邮箱地址</li>
                    <li>手机号：手机号码</li>
                    <li>日期：出生日期、入职日期等</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">选择字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>下拉选择：单选下拉框</li>
                    <li>单选按钮：单选按钮组</li>
                    <li>复选框：是/否选择</li>
                    <li>多选下拉：多选下拉框</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">特殊字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>文件上传：证件、证书等文件</li>
                    <li>身份证号：自动验证格式</li>
                    <li>地址：详细地址输入</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">复合字段</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>教育背景：学校、专业、学历等</li>
                    <li>工作经历：公司、职位、时间等</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">提示</h4>
              <p className="text-sm text-muted-foreground">
                • 建议先使用基础模板，然后根据实际需求调整
                <br />
                • 合理设置必填字段，避免过多必填导致用户体验不佳
                <br />
                • 使用分区功能将相关字段分组，提高表单可读性
                <br />
                • 定期在预览模式下测试表单，确保用户体验良好
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

