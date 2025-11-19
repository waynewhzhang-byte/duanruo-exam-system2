'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Type, 
  Mail, 
  Phone, 
  Calendar, 
  Hash, 
  ToggleLeft, 
  List, 
  FileText,
  Upload,
  CheckSquare,
  Radio,
  AlignLeft,
  GraduationCap,
  Briefcase,
  User,
  CreditCard,
  MapPin,
  Globe,
  Link as LinkIcon,
} from 'lucide-react'
import { FormField } from '@/types/form-template'
import { useState } from 'react'

interface FormBuilderSidebarProps {
  onAddField: (field: FormField) => void
}

// 字段类型定义
const FIELD_TYPES = [
  {
    category: '基础字段',
    fields: [
      {
        type: 'text',
        label: '单行文本',
        icon: Type,
        description: '短文本输入',
        defaultConfig: {
          type: 'text' as const,
          name: 'text_field',
          label: '文本字段',
          placeholder: '请输入',
          required: false,
          width: 'full' as const,
          order: 0,
        },
      },
      {
        type: 'textarea',
        label: '多行文本',
        icon: AlignLeft,
        description: '长文本输入',
        defaultConfig: {
          type: 'textarea' as const,
          name: 'textarea_field',
          label: '多行文本',
          placeholder: '请输入',
          required: false,
          width: 'full' as const,
          order: 0,
          rows: 4,
        },
      },
      {
        type: 'number',
        label: '数字',
        icon: Hash,
        description: '数字输入',
        defaultConfig: {
          type: 'number' as const,
          name: 'number_field',
          label: '数字字段',
          placeholder: '请输入数字',
          required: false,
          width: 'half' as const,
          order: 0,
        },
      },
      {
        type: 'email',
        label: '邮箱',
        icon: Mail,
        description: '邮箱地址',
        defaultConfig: {
          type: 'email' as const,
          name: 'email',
          label: '电子邮箱',
          placeholder: '请输入邮箱地址',
          required: false,
          width: 'half' as const,
          order: 0,
        },
      },
      {
        type: 'phone',
        label: '手机号',
        icon: Phone,
        description: '手机号码',
        defaultConfig: {
          type: 'phone' as const,
          name: 'phone',
          label: '手机号码',
          placeholder: '请输入手机号',
          required: false,
          width: 'half' as const,
          order: 0,
        },
      },
      {
        type: 'date',
        label: '日期',
        icon: Calendar,
        description: '日期选择',
        defaultConfig: {
          type: 'date' as const,
          name: 'date_field',
          label: '日期',
          placeholder: '选择日期',
          required: false,
          width: 'half' as const,
          order: 0,
        },
      },
    ],
  },
  {
    category: '选择字段',
    fields: [
      {
        type: 'select',
        label: '下拉选择',
        icon: List,
        description: '单选下拉框',
        defaultConfig: {
          type: 'select' as const,
          name: 'select_field',
          label: '下拉选择',
          placeholder: '请选择',
          required: false,
          width: 'half' as const,
          order: 0,
          options: [
            { label: '选项1', value: 'option1' },
            { label: '选项2', value: 'option2' },
          ],
        },
      },
      {
        type: 'radio',
        label: '单选按钮',
        icon: Radio,
        description: '单选按钮组',
        defaultConfig: {
          type: 'radio' as const,
          name: 'radio_field',
          label: '单选',
          required: false,
          width: 'full' as const,
          order: 0,
          options: [
            { label: '选项1', value: 'option1' },
            { label: '选项2', value: 'option2' },
          ],
        },
      },
      {
        type: 'checkbox',
        label: '复选框',
        icon: CheckSquare,
        description: '多选复选框',
        defaultConfig: {
          type: 'checkbox' as const,
          name: 'checkbox_field',
          label: '复选框',
          required: false,
          width: 'full' as const,
          order: 0,
        },
      },
      {
        type: 'multi-select',
        label: '多选下拉',
        icon: List,
        description: '多选下拉框',
        defaultConfig: {
          type: 'multi-select' as const,
          name: 'multi_select_field',
          label: '多选下拉',
          placeholder: '请选择',
          required: false,
          width: 'full' as const,
          order: 0,
          options: [
            { label: '选项1', value: 'option1' },
            { label: '选项2', value: 'option2' },
          ],
        },
      },
    ],
  },
  {
    category: '特殊字段',
    fields: [
      {
        type: 'file-upload',
        label: '文件上传',
        icon: Upload,
        description: '文件上传',
        defaultConfig: {
          type: 'file-upload' as const,
          name: 'file_field',
          label: '文件上传',
          required: false,
          width: 'full' as const,
          order: 0,
          fileConfig: {
            accept: '.pdf,.doc,.docx,.jpg,.png',
            maxSize: 5 * 1024 * 1024, // 5MB
            maxFiles: 1,
            category: 'document',
            description: '支持 PDF、Word、图片格式，最大 5MB',
          },
        },
      },
      {
        type: 'id-number',
        label: '身份证号',
        icon: CreditCard,
        description: '身份证号码',
        defaultConfig: {
          type: 'id-number' as const,
          name: 'idNumber',
          label: '身份证号',
          placeholder: '请输入身份证号',
          required: false,
          width: 'half' as const,
          order: 0,
        },
      },
      {
        type: 'address',
        label: '地址',
        icon: MapPin,
        description: '详细地址',
        defaultConfig: {
          type: 'address' as const,
          name: 'address',
          label: '联系地址',
          placeholder: '请输入详细地址',
          required: false,
          width: 'full' as const,
          order: 0,
        },
      },
    ],
  },
  {
    category: '复合字段',
    fields: [
      {
        type: 'education-background',
        label: '教育背景',
        icon: GraduationCap,
        description: '教育经历',
        defaultConfig: {
          type: 'education-background' as const,
          name: 'education',
          label: '教育背景',
          required: false,
          width: 'full' as const,
          order: 0,
        },
      },
      {
        type: 'work-experience',
        label: '工作经历',
        icon: Briefcase,
        description: '工作经验',
        defaultConfig: {
          type: 'work-experience' as const,
          name: 'workExperience',
          label: '工作经历',
          required: false,
          width: 'full' as const,
          order: 0,
        },
      },
    ],
  },
]

export default function FormBuilderSidebar({ onAddField }: FormBuilderSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFieldTypes = FIELD_TYPES.map(category => ({
    ...category,
    fields: category.fields.filter(field =>
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.fields.length > 0)

  return (
    <Card className="h-[calc(100vh-300px)]">
      <CardHeader>
        <CardTitle className="text-base">字段库</CardTitle>
        <CardDescription className="text-xs">拖拽或点击添加字段</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Input
          placeholder="搜索字段..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        <ScrollArea className="h-[calc(100%-60px)]">
          <div className="space-y-4">
            {filteredFieldTypes.map((category) => (
              <div key={category.category}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.fields.map((field) => {
                    const Icon = field.icon
                    return (
                      <Button
                        key={field.type}
                        variant="outline"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => onAddField(field.defaultConfig as FormField)}
                      >
                        <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">{field.label}</div>
                          <div className="text-xs text-muted-foreground">{field.description}</div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

