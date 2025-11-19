'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface WorkExperienceFieldProps {
  form: UseFormReturn<any>
  name: string
  label: string
  required?: boolean
  description?: string
}

interface WorkExperience {
  company: string
  position: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

export default function WorkExperienceField({
  form,
  name,
  label,
  required = false,
  description,
}: WorkExperienceFieldProps) {
  const addWorkExperience = () => {
    const current = form.getValues(name) || []
    form.setValue(name, [
      ...current,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      }
    ])
  }

  const removeWorkExperience = (index: number) => {
    const current = form.getValues(name) || []
    form.setValue(name, current.filter((_: any, i: number) => i !== index))
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: formField, fieldState }) => {
        const workExperiences = (formField.value || []) as WorkExperience[]

        return (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWorkExperience}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加工作经历
              </Button>
            </div>

            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}

            <FormControl>
              <div className="space-y-4">
                {workExperiences.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无工作经历，点击上方按钮添加</p>
                  </div>
                ) : (
                  workExperiences.map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">工作经历 {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeWorkExperience(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`${name}.${index}.company`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                公司名称
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="请输入公司名称"
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.position`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                职位
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="请输入职位名称"
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.startDate`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                开始时间
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.endDate`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>结束时间</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="date"
                                  disabled={form.watch(`${name}.${index}.isCurrent`)}
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`${name}.${index}.isCurrent`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                id={`current-work-${index}`}
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>目前在职</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`${name}.${index}.description`}
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>工作描述</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="请描述主要工作内容和职责"
                                rows={3}
                                className={fieldState.error ? 'border-red-500' : ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))
                )}
              </div>
            </FormControl>

            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
