'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField as FormFieldType, FormTemplate } from '@/types/form-template'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import FormFileUpload from '@/components/ui/formfileupload'
import EducationBackgroundField from './EducationBackgroundField'
import WorkExperienceField from './WorkExperienceField'

interface DynamicFieldProps {
  field: FormFieldType
  form: UseFormReturn<any>
  template: FormTemplate
  tenantId?: string // Optional: for file uploads when not in TenantProvider context
}

export default function DynamicField({ field, form, template, tenantId }: DynamicFieldProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'number':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type="number"
                    onChange={(e) => formField.onChange(Number(e.target.value))}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'date':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <Input
                    {...formField}
                    type="date"
                    disabled={field.disabled}
                    className={fieldState.error ? 'border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'textarea':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <Textarea
                    {...formField}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    className={fieldState.error ? 'border-red-500' : ''}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'select':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField, fieldState }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <select
                    {...formField}
                    disabled={field.disabled}
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${fieldState.error ? 'border-red-500' : ''}`}
                  >
                    <option value="">{field.placeholder || '请选择'}</option>
                    {field.options?.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'radio':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <RadioGroup
                    value={formField.value || ''}
                    onValueChange={formField.onChange}
                    disabled={field.disabled}
                  >
                    <div className="flex flex-wrap gap-4">
                      {field.options?.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={option.value}
                            id={`${field.name}-${option.value}`}
                            disabled={field.disabled || option.disabled}
                          />
                          <label
                            htmlFor={`${field.name}-${option.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'checkbox':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    id={field.name}
                    checked={formField.value || false}
                    onCheckedChange={formField.onChange}
                    disabled={field.disabled}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  {field.description && (
                    <p className="text-sm text-gray-500">{field.description}</p>
                  )}
                </div>
              </FormItem>
            )}
          />
        )

      case 'multi-select':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
                <FormControl>
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.name}-${option.value}`}
                          checked={(formField.value || []).includes(option.value)}
                          onCheckedChange={(checked) => {
                            const currentValue = formField.value || []
                            if (checked) {
                              formField.onChange([...currentValue, option.value])
                            } else {
                              formField.onChange(currentValue.filter((v: string) => v !== option.value))
                            }
                          }}
                          disabled={field.disabled || option.disabled}
                        />
                        <label
                          htmlFor={`${field.name}-${option.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'file-upload':
        if (!field.fileConfig) return null
        return (
          <FormFileUpload
            form={form}
            name={field.name}
            label={field.label}
            description={field.fileConfig.description}
            accept={field.fileConfig.accept}
            maxSize={field.fileConfig.maxSize}
            multiple={field.fileConfig.maxFiles > 1}
            required={field.required}
            category={field.fileConfig.category}
            tenantId={tenantId}
          />
        )

      case 'education-background':
        return (
          <EducationBackgroundField
            form={form}
            name={field.name}
            label={field.label}
            required={field.required}
            description={field.description}
          />
        )

      case 'work-experience':
        return (
          <WorkExperienceField
            form={form}
            name={field.name}
            label={field.label}
            required={field.required}
            description={field.description}
          />
        )

      case 'agreement':
        return (
          <FormField
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    id={field.name}
                    checked={formField.value || false}
                    onCheckedChange={formField.onChange}
                    disabled={field.disabled}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </FormLabel>
                  {field.description && (
                    <p className="text-sm text-gray-500">{field.description}</p>
                  )}
                </div>
              </FormItem>
            )}
          />
        )

      default:
        return (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-red-600">不支持的字段类型: {field.type}</p>
          </div>
        )
    }
  }

  return renderField()
}

