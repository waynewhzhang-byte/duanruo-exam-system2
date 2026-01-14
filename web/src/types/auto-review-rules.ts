/**
 * Auto-review rules types and schemas
 * 自动审核规则类型定义
 */

import { z } from 'zod'

// Rule action types
export type RuleAction = 'PASS' | 'AUTO_PASS' | 'REJECT' | 'AUTO_REJECT' | 'PENDING_REVIEW'

// Supported rule types
export type RuleType =
  | 'field_equals'      // 字段等于
  | 'field_gt'          // 字段大于
  | 'field_gte'         // 字段大于等于
  | 'field_lt'          // 字段小于
  | 'field_lte'         // 字段小于等于
  | 'field_between'     // 字段在范围内
  | 'field_regex'       // 字段正则匹配
  | 'field_contains'    // 字段包含
  | 'field_in'          // 字段在列表中
  | 'has_attachment'    // 有附件
  | 'logic_and'         // 逻辑与
  | 'logic_or'          // 逻辑或
  | 'logic_not'         // 逻辑非

// Base rule interface
export interface BaseRule {
  name: string
  type: RuleType
  action: RuleAction
  reason: string
  description?: string
  enabled?: boolean
}

// Field comparison rules
export interface FieldEqualsRule extends BaseRule {
  type: 'field_equals'
  field: string
  value: any
}

export interface FieldGtRule extends BaseRule {
  type: 'field_gt'
  field: string
  value: number
}

export interface FieldGteRule extends BaseRule {
  type: 'field_gte'
  field: string
  value: number
}

export interface FieldLtRule extends BaseRule {
  type: 'field_lt'
  field: string
  value: number
}

export interface FieldLteRule extends BaseRule {
  type: 'field_lte'
  field: string
  value: number
}

export interface FieldBetweenRule extends BaseRule {
  type: 'field_between'
  field: string
  min: number
  max: number
}

// String rules
export interface FieldRegexRule extends BaseRule {
  type: 'field_regex'
  field: string
  pattern: string
}

export interface FieldContainsRule extends BaseRule {
  type: 'field_contains'
  field: string
  substring: string
}

export interface FieldInRule extends BaseRule {
  type: 'field_in'
  field: string
  values: any[]
}

export interface HasAttachmentRule extends BaseRule {
  type: 'has_attachment'
  fieldKey: string
}

// Logic rules
export interface LogicAndRule extends BaseRule {
  type: 'logic_and'
  conditions: Rule[]
}

export interface LogicOrRule extends BaseRule {
  type: 'logic_or'
  conditions: Rule[]
}

export interface LogicNotRule extends BaseRule {
  type: 'logic_not'
  condition: Rule
}

// Union type for all rules
export type Rule =
  | FieldEqualsRule
  | FieldGtRule
  | FieldGteRule
  | FieldLtRule
  | FieldLteRule
  | FieldBetweenRule
  | FieldRegexRule
  | FieldContainsRule
  | FieldInRule
  | HasAttachmentRule
  | LogicAndRule
  | LogicOrRule
  | LogicNotRule

// Rule configuration
export interface RuleConfiguration {
  rules: Rule[]
}

// Rule validation result
export interface RuleValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Rule test result
export interface RuleTestResult {
  action: RuleAction
  reason: string
  matchedRules: string[]
  failedRules: string[]
  executionLog: string[]
  debugInfo: Record<string, any>
}

// Zod schemas for validation
export const RuleActionSchema = z.enum(['PASS', 'AUTO_PASS', 'REJECT', 'AUTO_REJECT', 'PENDING_REVIEW'])

export const BaseRuleSchema = z.object({
  name: z.string().min(1, '规则名称不能为空'),
  type: z.string(),
  action: RuleActionSchema,
  reason: z.string().min(1, '原因说明不能为空'),
  description: z.string().optional(),
  enabled: z.boolean().optional().default(true),
})

export const FieldEqualsRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_equals'),
  field: z.string().min(1, '字段名不能为空'),
  value: z.any(),
})

export const FieldGtRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_gt'),
  field: z.string().min(1, '字段名不能为空'),
  value: z.number(),
})

export const FieldGteRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_gte'),
  field: z.string().min(1, '字段名不能为空'),
  value: z.number(),
})

export const FieldLtRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_lt'),
  field: z.string().min(1, '字段名不能为空'),
  value: z.number(),
})

export const FieldLteRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_lte'),
  field: z.string().min(1, '字段名不能为空'),
  value: z.number(),
})

// Note: Cannot use .refine() here as it breaks discriminatedUnion
// Validation for min < max should be done at the form level
export const FieldBetweenRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_between'),
  field: z.string().min(1, '字段名不能为空'),
  min: z.number(),
  max: z.number(),
})

export const FieldRegexRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_regex'),
  field: z.string().min(1, '字段名不能为空'),
  pattern: z.string().min(1, '正则表达式不能为空'),
})

export const FieldContainsRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_contains'),
  field: z.string().min(1, '字段名不能为空'),
  substring: z.string().min(1, '子字符串不能为空'),
})

export const FieldInRuleSchema = BaseRuleSchema.extend({
  type: z.literal('field_in'),
  field: z.string().min(1, '字段名不能为空'),
  values: z.array(z.any()).min(1, '至少需要一个值'),
})

export const HasAttachmentRuleSchema = BaseRuleSchema.extend({
  type: z.literal('has_attachment'),
  fieldKey: z.string().min(1, '附件字段键不能为空'),
})

export const RuleSchema: z.ZodType<Rule> = z.discriminatedUnion('type', [
  FieldEqualsRuleSchema,
  FieldGtRuleSchema,
  FieldGteRuleSchema,
  FieldLtRuleSchema,
  FieldLteRuleSchema,
  FieldBetweenRuleSchema,
  FieldRegexRuleSchema,
  FieldContainsRuleSchema,
  FieldInRuleSchema,
  HasAttachmentRuleSchema,
  // Note: Logic rules (and/or/not) are recursive and would need lazy evaluation
  // For now, we'll handle them separately in the UI
]) as any

export const RuleConfigurationSchema = z.object({
  rules: z.array(z.any()), // Use any for now to support logic rules
})

// Rule templates for common use cases
export const RULE_TEMPLATES = {
  AGE_RANGE: {
    name: '年龄限制',
    type: 'field_between' as const,
    field: 'age',
    min: 18,
    max: 35,
    action: 'REJECT' as const,
    reason: '年龄不符合要求（18-35岁）',
    description: '限制年龄在18-35岁之间',
  },
  GENDER_LIMIT: {
    name: '性别限制',
    type: 'field_equals' as const,
    field: 'gender',
    value: 'MALE',
    action: 'REJECT' as const,
    reason: '性别不符合岗位要求',
    description: '限制特定性别',
  },
  EDUCATION_REQUIREMENT: {
    name: '学历要求',
    type: 'field_in' as const,
    field: 'education',
    values: ['BACHELOR', 'MASTER', 'PHD'],
    action: 'REJECT' as const,
    reason: '学历不符合要求（需本科及以上）',
    description: '要求本科及以上学历',
  },
  ID_CARD_FORMAT: {
    name: '身份证格式检查',
    type: 'field_regex' as const,
    field: 'idNumber',
    pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
    action: 'REJECT' as const,
    reason: '身份证号码格式不正确',
    description: '验证身份证号码格式',
  },
}

// Rule type labels for display
export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  field_equals: '字段等于',
  field_gt: '字段大于',
  field_gte: '字段大于等于',
  field_lt: '字段小于',
  field_lte: '字段小于等于',
  field_between: '字段在范围内',
  field_regex: '正则匹配',
  field_contains: '字段包含',
  field_in: '字段在列表中',
  has_attachment: '有附件',
  logic_and: '逻辑与',
  logic_or: '逻辑或',
  logic_not: '逻辑非',
}

// Rule action labels
export const RULE_ACTION_LABELS: Record<RuleAction, string> = {
  PASS: '通过',
  AUTO_PASS: '自动通过',
  REJECT: '拒绝',
  AUTO_REJECT: '自动拒绝',
  PENDING_REVIEW: '人工审核',
}

// Get rule type label
export function getRuleTypeLabel(type: RuleType): string {
  return RULE_TYPE_LABELS[type] || type
}

// Get rule action label
export function getRuleActionLabel(action: RuleAction): string {
  return RULE_ACTION_LABELS[action] || action
}
