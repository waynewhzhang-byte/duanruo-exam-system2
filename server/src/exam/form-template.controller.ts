import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Prisma } from '@prisma/client';
import { ExamService } from './exam.service';
import type { ExamResponse } from './dto/exam.dto';
import { getErrorMessage } from '../common/utils/error.util';

class CreateFormTemplateRequest {
  @IsString()
  templateName: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateFormTemplateRequest {
  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  examId?: string;
}

class BatchUpdateFormTemplateRequest {
  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  fields?: unknown[];
}

interface FormTemplateData {
  id: string;
  templateName: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  fields: unknown[];
  createdAt: string;
  updatedAt: string;
}

function isFormTemplateData(v: unknown): v is FormTemplateData {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o['id'] === 'string' &&
    typeof o['templateName'] === 'string' &&
    typeof o['status'] === 'string' &&
    typeof o['version'] === 'number'
  );
}

function getFormTemplateFromExam(exam: ExamResponse): FormTemplateData | null {
  const raw = exam.formTemplate;
  return isFormTemplateData(raw) ? raw : null;
}

type FormFieldRow = Record<string, unknown>;

@Controller('form-templates')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class FormTemplateController {
  private readonly logger = new Logger(FormTemplateController.name);
  constructor(private readonly examService: ExamService) {}

  @Get()
  @Permissions('exam:view')
  async list(@Query('examId') examId?: string) {
    // If examId provided, return the template associated with that exam
    if (examId) {
      try {
        const exam = await this.examService.findById(examId);
        const formTemplate = getFormTemplateFromExam(exam);
        if (formTemplate) {
          return ApiResult.ok([formTemplate], 'Form templates listed');
        }
        return ApiResult.ok([], 'Form templates listed');
      } catch {
        return ApiResult.ok([], 'Form templates listed');
      }
    }
    return ApiResult.ok([], 'Form templates listed');
  }

  @Get(':id')
  @Permissions('exam:view')
  async getById(@Param('id') id: string, @Query('examId') examId?: string) {
    // Try to find the template in the exam's formTemplate field
    if (examId) {
      try {
        const exam = await this.examService.findById(examId);
        const formTemplate = getFormTemplateFromExam(exam);
        if (formTemplate && formTemplate.id === id) {
          return ApiResult.ok(formTemplate, 'Form template retrieved');
        }
      } catch {
        // Exam not found
      }
    }
    // Return a default template structure
    return ApiResult.ok(
      {
        id,
        templateName: 'Default Template',
        status: 'DRAFT',
        version: 1,
        fields: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'Form template retrieved',
    );
  }

  @Post()
  @Permissions('exam:create')
  async create(
    @Body() data: CreateFormTemplateRequest,
    @Query('examId') examId?: string,
  ) {
    const { templateName, description } = data;
    const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const formTemplate: FormTemplateData = {
      id: templateId,
      templateName: templateName || '报名表单模板',
      description: description || '报名表单模板',
      status: 'DRAFT',
      version: 1,
      fields: [],
      createdAt: now,
      updatedAt: now,
    };

    if (examId) {
      await this.examService.updateFormTemplateData(
        examId,
        formTemplate as unknown as Prisma.InputJsonValue,
      );
    }

    return ApiResult.ok(formTemplate, 'Form template created');
  }

  @Put(':id')
  @Permissions('exam:edit')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateFormTemplateRequest,
    @Query('examId') queryExamId?: string,
  ) {
    const examId = data.examId || queryExamId;

    if (!examId) {
      throw new BadRequestException('更新失败：缺少 examId');
    }

    const exam = await this.examService.findById(examId);
    const existingTemplate = getFormTemplateFromExam(exam);

    if (!existingTemplate || existingTemplate.id !== id) {
      throw new NotFoundException('模板不存在或不属于该考试');
    }

    const updatedTemplate: FormTemplateData = {
      ...existingTemplate,
      templateName: data.templateName || existingTemplate.templateName,
      description: data.description || existingTemplate.description,
      updatedAt: new Date().toISOString(),
    };

    // Ensure fields have IDs
    if (updatedTemplate.fields) {
      updatedTemplate.fields = updatedTemplate.fields.map((f) => {
        const row = f as FormFieldRow;
        return {
          ...row,
          id:
            row['id'] ||
            row['fieldKey'] ||
            `field-${Math.random().toString(36).substr(2, 9)}`,
        };
      });
    }

    await this.examService.updateFormTemplateData(
      examId,
      updatedTemplate as unknown as Prisma.InputJsonValue,
    );
    return ApiResult.ok(updatedTemplate, 'Template updated');
  }

  @Put(':id/batch')
  @Permissions('exam:edit')
  async batchUpdate(
    @Param('id') id: string,
    @Body() data: BatchUpdateFormTemplateRequest,
    @Query('examId') examId?: string,
  ) {
    if (!examId) {
      throw new BadRequestException('批量更新失败：缺少 examId');
    }

    const exam = await this.examService.findById(examId);
    const existingTemplate = getFormTemplateFromExam(exam);
    const now = new Date().toISOString();

    let updatedTemplate: FormTemplateData;

    if (existingTemplate && existingTemplate.id === id) {
      updatedTemplate = {
        ...existingTemplate,
        templateName: data.templateName || existingTemplate.templateName,
        description: data.description || existingTemplate.description,
        fields: data.fields || existingTemplate.fields,
        version: (existingTemplate.version || 1) + 1,
        updatedAt: now,
      };
    } else {
      updatedTemplate = {
        id,
        templateName: data.templateName || '报名表单模板',
        description: data.description || '',
        status: 'DRAFT',
        version: 1,
        fields: data.fields || [],
        createdAt: now,
        updatedAt: now,
      };
    }

    // CRITICAL FIX: Ensure every field has an ID for Zod validation
    if (updatedTemplate.fields) {
      updatedTemplate.fields = updatedTemplate.fields.map((f) => {
        const row = f as FormFieldRow;
        return {
          ...row,
          id:
            row['id'] ||
            row['fieldKey'] ||
            `f-${Math.random().toString(36).substr(2, 9)}`,
        };
      });
    }

    await this.examService.updateFormTemplateData(
      examId,
      updatedTemplate as unknown as Prisma.InputJsonValue,
    );
    return ApiResult.ok(updatedTemplate, 'Batch update successful');
  }

  @Post(':id/publish')
  @Permissions('exam:publish')
  async publish(@Param('id') id: string, @Query('examId') examId?: string) {
    if (!examId) {
      throw new BadRequestException('发布失败：缺少 examId');
    }

    try {
      const exam = await this.examService.findById(examId);
      if (!exam) {
        throw new NotFoundException('发布失败：考试不存在');
      }

      const existingTemplate = getFormTemplateFromExam(exam);

      if (!existingTemplate) {
        throw new BadRequestException(
          '发布失败：该考试尚未配置表单模板，请先保存表单',
        );
      }

      if (existingTemplate.id !== id) {
        throw new BadRequestException(
          '发布失败：模板 ID 不匹配，请刷新页面后重试',
        );
      }

      const publishedTemplate: FormTemplateData = {
        ...existingTemplate,
        status: 'PUBLISHED' as const,
        updatedAt: new Date().toISOString(),
      };

      // Ensure fields have IDs during publish return
      if (publishedTemplate.fields) {
        publishedTemplate.fields = publishedTemplate.fields.map((f) => {
          const row = f as FormFieldRow;
          return {
            ...row,
            id: row['id'] || row['fieldKey'],
          };
        });
      }

      await this.examService.updateFormTemplateData(
        examId,
        publishedTemplate as unknown as Prisma.InputJsonValue,
      );
      return ApiResult.ok(
        { ...publishedTemplate, published: true },
        '表单模板已发布',
      );
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Failed to publish form template', error);
      throw new BadRequestException(
        '发布表单模板时发生未知错误: ' + getErrorMessage(error),
      );
    }
  }
}
