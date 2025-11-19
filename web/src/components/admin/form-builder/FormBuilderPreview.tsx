'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormTemplate } from '@/types/form-template'
import DynamicForm from '@/components/forms/DynamicForm'
import { toast } from 'sonner'

interface FormBuilderPreviewProps {
  template: FormTemplate
}

export default function FormBuilderPreview({ template }: FormBuilderPreviewProps) {
  const handleSubmit = async (data: Record<string, any>) => {
    console.log('Preview form submitted:', data)
    toast.success('预览提交成功（仅用于测试）')
  }

  const handleSaveDraft = async (data: Record<string, any>) => {
    console.log('Preview draft saved:', data)
    toast.success('预览草稿保存成功（仅用于测试）')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>表单预览</CardTitle>
        <CardDescription>
          这是表单的实时预览，您可以测试填写和提交（不会真正保存数据）
        </CardDescription>
      </CardHeader>
      <CardContent>
        {template.sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无表单内容</p>
            <p className="text-sm mt-2">请在设计视图中添加分区和字段</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <DynamicForm
              template={template}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

