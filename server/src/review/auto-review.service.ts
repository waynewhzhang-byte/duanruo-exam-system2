import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 自动审核规则类型
 */
export enum AutoReviewRuleType {
  AGE_RANGE = 'age_range',
  GENDER = 'gender',
  EDUCATION = 'education',
  WORK_EXPERIENCE = 'work_experience',
  ID_NUMBER = 'id_number',
  PHONE = 'phone',
  EMAIL = 'email',
  CUSTOM_FIELD = 'custom_field',
}

/**
 * 自动审核规则接口
 */
export interface AutoReviewRule {
  type: AutoReviewRuleType;
  field: string; // 字段名
  required: boolean; // 是否必填
  rejectReason?: string; // 不通过时的原因

  // 年龄范围
  minAge?: number;
  maxAge?: number;

  // 性别
  allowedGenders?: string[];

  // 学历
  minEducationLevel?: string;
  educationLevels?: string[]; // 按顺序：小学、初中、高中、专科、本科、硕士、博士

  // 工作年限
  minWorkYears?: number;
  maxWorkYears?: number;

  // 枚举值
  allowedValues?: string[];

  // 正则表达式
  pattern?: string;

  // 自定义验证
  customValidator?: string;
}

/**
 * 自动审核配置
 */
export interface AutoReviewConfig {
  enabled: boolean;
  rules: AutoReviewRule[];
}

/**
 * 自动审核结果
 */
export interface AutoReviewResult {
  passed: boolean;
  failedRules: {
    rule: AutoReviewRule;
    reason: string;
    fieldValue: any;
  }[];
  summary: string;
}

/**
 * 自动审核服务
 */
@Injectable()
export class AutoReviewService {
  private readonly logger = new Logger(AutoReviewService.name);

  // 学历等级映射
  private readonly EDUCATION_LEVELS = {
    小学: 1,
    初中: 2,
    高中: 3,
    中专: 3,
    专科: 4,
    大专: 4,
    本科: 5,
    学士: 5,
    硕士: 6,
    研究生: 6,
    博士: 7,
  };

  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  /**
   * 执行自动审核
   */
  async executeAutoReview(
    applicationId: string,
  ): Promise<AutoReviewResult> {
    this.logger.log(`Starting auto-review for application: ${applicationId}`);

    // 1. 获取报名信息
    const application = await this.client.application.findUnique({
      where: { id: applicationId },
      include: {
        position: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // 2. 获取自动审核规则
    const config = this.getAutoReviewConfig(application.position.rulesConfig);

    if (!config.enabled) {
      this.logger.log('Auto-review disabled for this position');
      return {
        passed: true,
        failedRules: [],
        summary: 'Auto-review is disabled',
      };
    }

    // 3. 执行规则验证
    const failedRules: AutoReviewResult['failedRules'] = [];
    const payload = application.payload as any;

    for (const rule of config.rules) {
      const fieldValue = this.getFieldValue(payload, rule.field);

      // 检查必填
      if (rule.required && this.isEmpty(fieldValue)) {
        failedRules.push({
          rule,
          reason: rule.rejectReason || `字段 ${rule.field} 为必填项`,
          fieldValue,
        });
        continue;
      }

      // 如果字段为空且非必填，跳过验证
      if (this.isEmpty(fieldValue)) {
        continue;
      }

      // 根据规则类型验证
      const validationResult = await this.validateRule(rule, fieldValue);
      if (!validationResult.passed) {
        failedRules.push({
          rule,
          reason: validationResult.reason,
          fieldValue,
        });
      }
    }

    const passed = failedRules.length === 0;
    const summary = passed
      ? '自动审核通过'
      : `自动审核未通过，共 ${failedRules.length} 项不符合要求`;

    this.logger.log(
      `Auto-review completed for ${applicationId}: ${passed ? 'PASSED' : 'FAILED'}`,
    );

    return {
      passed,
      failedRules,
      summary,
    };
  }

  /**
   * 应用自动审核结果到报名
   */
  async applyAutoReviewResult(
    applicationId: string,
    result: AutoReviewResult,
  ): Promise<void> {
    const newStatus = result.passed ? 'AUTO_PASSED' : 'AUTO_REJECTED';
    const reason = result.passed
      ? result.summary
      : result.failedRules.map((f) => f.reason).join('; ');

    await this.client.$transaction(async (tx) => {
      // 更新报名状态
      const app = await tx.application.findUnique({
        where: { id: applicationId },
      });

      await tx.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
      });

      // 记录审计日志
      await tx.applicationAuditLog.create({
        data: {
          id: uuidv4(),
          applicationId,
          fromStatus: app?.status || 'SUBMITTED',
          toStatus: newStatus,
          actor: 'AUTO_REVIEW_ENGINE',
          reason,
          metadata: {
            autoReviewResult: result,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // 如果通过，创建待一审的任务
      if (result.passed) {
        await tx.application.update({
          where: { id: applicationId },
          data: { status: 'PENDING_PRIMARY_REVIEW' },
        });

        await tx.applicationAuditLog.create({
          data: {
            id: uuidv4(),
            applicationId,
            fromStatus: 'AUTO_PASSED',
            toStatus: 'PENDING_PRIMARY_REVIEW',
            actor: 'SYSTEM',
            reason: '自动审核通过，进入人工审核队列',
          },
        });
      }
    });

    this.logger.log(
      `Applied auto-review result for ${applicationId}: ${newStatus}`,
    );
  }

  /**
   * 验证单个规则
   */
  private async validateRule(
    rule: AutoReviewRule,
    value: any,
  ): Promise<{ passed: boolean; reason: string }> {
    try {
      switch (rule.type) {
        case AutoReviewRuleType.AGE_RANGE:
          return this.validateAgeRange(rule, value);

        case AutoReviewRuleType.GENDER:
          return this.validateGender(rule, value);

        case AutoReviewRuleType.EDUCATION:
          return this.validateEducation(rule, value);

        case AutoReviewRuleType.WORK_EXPERIENCE:
          return this.validateWorkExperience(rule, value);

        case AutoReviewRuleType.ID_NUMBER:
          return this.validateIdNumber(rule, value);

        case AutoReviewRuleType.PHONE:
          return this.validatePhone(rule, value);

        case AutoReviewRuleType.EMAIL:
          return this.validateEmail(rule, value);

        case AutoReviewRuleType.CUSTOM_FIELD:
          return this.validateCustomField(rule, value);

        default:
          return { passed: true, reason: '' };
      }
    } catch (error) {
      this.logger.error(`Rule validation error: ${error.message}`);
      return {
        passed: false,
        reason: `验证失败: ${error.message}`,
      };
    }
  }

  /**
   * 验证年龄范围
   */
  private validateAgeRange(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const age = this.parseAge(value);

    if (age === null) {
      return {
        passed: false,
        reason: rule.rejectReason || '无法解析年龄信息',
      };
    }

    if (rule.minAge && age < rule.minAge) {
      return {
        passed: false,
        reason:
          rule.rejectReason || `年龄不符合要求（最小 ${rule.minAge} 岁）`,
      };
    }

    if (rule.maxAge && age > rule.maxAge) {
      return {
        passed: false,
        reason:
          rule.rejectReason || `年龄不符合要求（最大 ${rule.maxAge} 岁）`,
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证性别
   */
  private validateGender(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const gender = String(value).trim();

    if (
      rule.allowedGenders &&
      !rule.allowedGenders.some((g) => g === gender)
    ) {
      return {
        passed: false,
        reason:
          rule.rejectReason ||
          `性别不符合要求（要求：${rule.allowedGenders.join('或')}）`,
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证学历
   */
  private validateEducation(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const education = String(value).trim();
    const educationLevel = this.EDUCATION_LEVELS[education];

    if (!educationLevel) {
      return {
        passed: false,
        reason: rule.rejectReason || '学历信息无效',
      };
    }

    if (rule.minEducationLevel) {
      const minLevel = this.EDUCATION_LEVELS[rule.minEducationLevel];
      if (educationLevel < minLevel) {
        return {
          passed: false,
          reason:
            rule.rejectReason ||
            `学历不符合要求（要求：${rule.minEducationLevel}及以上）`,
        };
      }
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证工作年限
   */
  private validateWorkExperience(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const years = Number(value);

    if (isNaN(years)) {
      return {
        passed: false,
        reason: rule.rejectReason || '工作年限格式错误',
      };
    }

    if (rule.minWorkYears && years < rule.minWorkYears) {
      return {
        passed: false,
        reason:
          rule.rejectReason ||
          `工作年限不符合要求（最少 ${rule.minWorkYears} 年）`,
      };
    }

    if (rule.maxWorkYears && years > rule.maxWorkYears) {
      return {
        passed: false,
        reason:
          rule.rejectReason ||
          `工作年限不符合要求（最多 ${rule.maxWorkYears} 年）`,
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证身份证号
   */
  private validateIdNumber(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const idNumber = String(value).trim();

    // 18位身份证号正则
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;

    if (!pattern.test(idNumber)) {
      return {
        passed: false,
        reason: rule.rejectReason || '身份证号格式不正确',
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证手机号
   */
  private validatePhone(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const phone = String(value).trim();
    const pattern = /^1[3-9]\d{9}$/;

    if (!pattern.test(phone)) {
      return {
        passed: false,
        reason: rule.rejectReason || '手机号格式不正确',
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证邮箱
   */
  private validateEmail(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    const email = String(value).trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(email)) {
      return {
        passed: false,
        reason: rule.rejectReason || '邮箱格式不正确',
      };
    }

    return { passed: true, reason: '' };
  }

  /**
   * 验证自定义字段
   */
  private validateCustomField(
    rule: AutoReviewRule,
    value: any,
  ): { passed: boolean; reason: string } {
    // 枚举值验证
    if (rule.allowedValues) {
      if (!rule.allowedValues.includes(String(value))) {
        return {
          passed: false,
          reason:
            rule.rejectReason ||
            `值不在允许范围内（允许值：${rule.allowedValues.join('、')}）`,
        };
      }
    }

    // 正则验证
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(String(value))) {
        return {
          passed: false,
          reason: rule.rejectReason || '格式不符合要求',
        };
      }
    }

    return { passed: true, reason: '' };
  }

  /**
   * 解析年龄
   */
  private parseAge(value: any): number | null {
    // 如果直接是年龄数字
    if (typeof value === 'number') {
      return value;
    }

    // 如果是字符串数字
    const ageNum = Number(value);
    if (!isNaN(ageNum)) {
      return ageNum;
    }

    // 如果是身份证号，从中提取出生日期
    const idNumber = String(value).trim();
    if (/^\d{17}[\dXx]$/.test(idNumber)) {
      const year = parseInt(idNumber.substring(6, 10));
      const month = parseInt(idNumber.substring(10, 12));
      const day = parseInt(idNumber.substring(12, 14));

      const birthDate = new Date(year, month - 1, day);
      const today = new Date();

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    }

    return null;
  }

  /**
   * 获取自动审核配置
   */
  private getAutoReviewConfig(rulesConfig: any): AutoReviewConfig {
    if (!rulesConfig || typeof rulesConfig !== 'object') {
      return { enabled: false, rules: [] };
    }

    const autoReview = rulesConfig.autoReview;
    if (!autoReview) {
      return { enabled: false, rules: [] };
    }

    return {
      enabled: autoReview.enabled || false,
      rules: autoReview.rules || [],
    };
  }

  /**
   * 获取字段值（支持嵌套）
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    const keys = fieldPath.split('.');
    let value = obj;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 检查值是否为空
   */
  private isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    );
  }
}
