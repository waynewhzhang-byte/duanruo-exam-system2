'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { FormSection, FormField } from '@/types/form-template'

interface FieldConfigPanelProps {
  section: FormSection
  field: FormField
  onUpdateField: (updates: Partial<FormField>) => void
}

export default function FieldConfigPanel({ section, field, onUpdateField }: FieldConfigPanelProps) {
  return (
    <div className="space-y-4">
      {/* 基础配置 */}
      <div>
        <Label>字段名称（name）</Label>
        <Input
          value={field.name}
          onChange={(e) => onUpdateField({ name: e.target.value })}
          placeholder="字段的唯一标识"
        />
        <p className="text-xs text-muted-foreground mt-1">
          用于数据存储的字段名，建议使用英文
        </p>
      </div>

      <div>
        <Label>字段标签</Label>
        <Input
          value={field.label}
          onChange={(e) => onUpdateField({ label: e.target.value })}
          placeholder="显示给用户的标签"
        />
      </div>

      {/* 占位符（适用于输入类字段） */}
      {['text', 'textarea', 'email', 'phone', 'number', 'date', 'select', 'multi-select', 'address', 'id-number'].includes(field.type) && (
        <div>
          <Label>占位符</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdateField({ placeholder: e.target.value })}
            placeholder="输入提示文字"
          />
        </div>
      )}

      {/* 描述 */}
      <div>
        <Label>字段描述</Label>
        <Textarea
          value={field.description || ''}
          onChange={(e) => onUpdateField({ description: e.target.value })}
          placeholder="字段的详细说明（可选）"
          rows={2}
        />
      </div>

      {/* 必填 */}
      <div className="flex items-center justify-between">
        <Label>必填</Label>
        <Switch
          checked={field.required}
          onCheckedChange={(checked) => onUpdateField({ required: checked })}
        />
      </div>

      {/* 宽度 */}
      <div>
        <Label>字段宽度</Label>
        <Select
          value={field.width}
          onValueChange={(value) => onUpdateField({ width: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">全宽</SelectItem>
            <SelectItem value="half">半宽</SelectItem>
            <SelectItem value="third">三分之一</SelectItem>
            <SelectItem value="quarter">四分之一</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 选项配置（适用于 select, radio, multi-select） */}
      {['select', 'radio', 'multi-select'].includes(field.type) && (
        <div>
          <Label>选项配置</Label>
          <div className="space-y-2 mt-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])]
                    newOptions[index] = { ...option, label: e.target.value }
                    onUpdateField({ options: newOptions })
                  }}
                  placeholder="选项标签"
                  className="flex-1"
                />
                <Input
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])]
                    newOptions[index] = { ...option, value: e.target.value }
                    onUpdateField({ options: newOptions })
                  }}
                  placeholder="选项值"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = field.options?.filter((_, i) => i !== index)
                    onUpdateField({ options: newOptions })
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [
                  ...(field.options || []),
                  { label: `选项${(field.options?.length || 0) + 1}`, value: `option${(field.options?.length || 0) + 1}` },
                ]
                onUpdateField({ options: newOptions })
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加选项
            </Button>
          </div>
        </div>
      )}

      {/* 文件上传配置 */}
      {field.type === 'file-upload' && (
        <div className="space-y-4">
          <div>
            <Label>文件类型</Label>
            <Input
              value={field.fileConfig?.accept || ''}
              onChange={(e) =>
                onUpdateField({
                  fileConfig: { ...field.fileConfig!, accept: e.target.value },
                })
              }
              placeholder=".pdf,.doc,.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              例如: .pdf,.doc,.docx,.jpg,.png
            </p>
          </div>
          <div>
            <Label>最大文件大小（MB）</Label>
            <Input
              type="number"
              value={(field.fileConfig?.maxSize || 0) / (1024 * 1024)}
              onChange={(e) =>
                onUpdateField({
                  fileConfig: {
                    ...field.fileConfig!,
                    maxSize: parseFloat(e.target.value) * 1024 * 1024,
                  },
                })
              }
              placeholder="5"
            />
          </div>
          <div>
            <Label>最大文件数量</Label>
            <Input
              type="number"
              value={field.fileConfig?.maxFiles || 1}
              onChange={(e) =>
                onUpdateField({
                  fileConfig: {
                    ...field.fileConfig!,
                    maxFiles: parseInt(e.target.value),
                  },
                })
              }
              placeholder="1"
            />
          </div>
          <div>
            <Label>文件分类</Label>
            <Select
              value={field.fileConfig?.category || 'document'}
              onValueChange={(value) =>
                onUpdateField({
                  fileConfig: { ...field.fileConfig!, category: value as any },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">文档</SelectItem>
                <SelectItem value="image">图片</SelectItem>
                <SelectItem value="certificate">证书</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 多行文本行数 - 注释掉，FormField类型中不包含rows属性 */}
      {/* {field.type === 'textarea' && (
        <div>
          <Label>行数</Label>
          <Input
            type="number"
            defaultValue={4}
            min={2}
            max={20}
          />
        </div>
      )} */}

      {/* 数字字段配置 - 注释掉，FormField类型中不包含min/max属性，应使用validation */}
      {/* {field.type === 'number' && (
        <>
          <div>
            <Label>最小值</Label>
            <Input
              type="number"
              placeholder="不限制"
            />
          </div>
          <div>
            <Label>最大值</Label>
            <Input
              type="number"
              placeholder="不限制"
            />
          </div>
        </>
      )} */}

      {/* 文本长度限制 - 注释掉，FormField类型中不包含minLength/maxLength属性，应使用validation */}
      {/* {['text', 'textarea'].includes(field.type) && (
        <>
          <div>
            <Label>最小长度</Label>
            <Input
              type="number"
              placeholder="不限制"
            />
          </div>
          <div>
            <Label>最大长度</Label>
            <Input
              type="number"
              placeholder="不限制"
            />
          </div>
        </>
      )} */}

      {/* 默认值 */}
      {!['file-upload', 'education-background', 'work-experience'].includes(field.type) && (
        <div>
          <Label>默认值</Label>
          {field.type === 'textarea' ? (
            <Textarea
              value={typeof field.defaultValue === 'string' ? field.defaultValue : ''}
              onChange={(e) => onUpdateField({ defaultValue: e.target.value })}
              placeholder="默认值（可选）"
              rows={2}
            />
          ) : field.type === 'checkbox' ? (
            <Switch
              checked={field.defaultValue === true}
              onCheckedChange={(checked) => onUpdateField({ defaultValue: checked })}
            />
          ) : (
            <Input
              value={typeof field.defaultValue === 'string' || typeof field.defaultValue === 'number' ? field.defaultValue : ''}
              onChange={(e) => onUpdateField({ defaultValue: e.target.value })}
              placeholder="默认值（可选）"
            />
          )}
        </div>
      )}

      {/* 显示条件 */}
      <div className="flex items-center justify-between">
        <Label>启用显示条件</Label>
        <Switch
          checked={!!field.conditional}
          onCheckedChange={(checked) => {
            if (checked) {
              onUpdateField({
                conditional: {
                  field: '',
                  operator: 'equals',
                  value: '',
                },
              })
            } else {
              onUpdateField({ conditional: undefined })
            }
          }}
        />
      </div>

      {field.conditional && (
        <div className="space-y-2 pl-4 border-l-2">
          <div>
            <Label className="text-xs">依赖字段</Label>
            <Input
              value={field.conditional.field}
              onChange={(e) =>
                onUpdateField({
                  conditional: { ...field.conditional!, field: e.target.value },
                })
              }
              placeholder="字段名"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">条件</Label>
            <Select
              value={field.conditional.operator}
              onValueChange={(value) =>
                onUpdateField({
                  conditional: { ...field.conditional!, operator: value as any },
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">等于</SelectItem>
                <SelectItem value="not-equals">不等于</SelectItem>
                <SelectItem value="contains">包含</SelectItem>
                <SelectItem value="not-contains">不包含</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">值</Label>
            <Input
              value={typeof field.conditional.value === 'string' || typeof field.conditional.value === 'number' ? field.conditional.value : ''}
              onChange={(e) =>
                onUpdateField({
                  conditional: { ...field.conditional!, value: e.target.value },
                })
              }
              placeholder="比较值"
              className="h-8"
            />
          </div>
        </div>
      )}
    </div>
  )
}

