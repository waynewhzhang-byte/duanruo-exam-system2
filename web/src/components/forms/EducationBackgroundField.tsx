'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { EDUCATION_LEVEL_LABELS, EducationLevel } from '@/types/application'
import { Plus, Trash2 } from 'lucide-react'

interface EducationBackgroundFieldProps {
  form: UseFormReturn<any>
  name: string
  label: string
  required?: boolean
  description?: string
}

interface EducationBackground {
  school: string
  major: string
  level: EducationLevel
  startDate: string
  endDate: string
  isCurrent: boolean
  gpa: string
}

export default function EducationBackgroundField({
  form,
  name,
  label,
  required = false,
  description,
}: EducationBackgroundFieldProps) {
  const addEducationBackground = () => {
    const current = form.getValues(name) || []
    form.setValue(name, [
      ...current,
      {
        school: '',
        major: '',
        level: 'BACHELOR',
        startDate: '',
        endDate: '',
        isCurrent: false,
        gpa: '',
      }
    ])
  }

  const removeEducationBackground = (index: number) => {
    const current = form.getValues(name) || []
    if (current.length > 1) {
      form.setValue(name, current.filter((_: any, i: number) => i !== index))
    }
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: formField, fieldState }) => {
        const educationBackgrounds = (formField.value || []) as EducationBackground[]

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
                onClick={addEducationBackground}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加教育经历
              </Button>
            </div>

            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}

            <FormControl>
              <div className="space-y-4">
                {educationBackgrounds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无教育经历，点击上方按钮添加</p>
                  </div>
                ) : (
                  educationBackgrounds.map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-900">教育经历 {index + 1}</h4>
                        {educationBackgrounds.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEducationBackground(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`${name}.${index}.school`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                学校名称
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="请输入学校名称"
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.major`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                专业
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="请输入专业名称"
                                  className={fieldState.error ? 'border-red-500' : ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.level`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>
                                学历层次
                                <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`${name}.${index}.gpa`}
                          render={({ field, fieldState }) => (
                            <FormItem>
                              <FormLabel>GPA/成绩</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="如：3.8/4.0 或 85/100"
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
                                id={`current-education-${index}`}
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>目前在读</FormLabel>
                            </div>
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
