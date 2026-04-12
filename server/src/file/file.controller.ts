import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { FileService } from './file.service';
import {
  FileUploadUrlRequest,
  FileConfimRequest,
  FileBatchInfoRequest,
  FileInfoResponse,
  FileUploadConfirmResponse,
} from './dto/file.dto';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('files')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private readonly fileService: FileService) {}

  @Post('upload-url')
  @Permissions('file:upload') // Frontend uses FILE_UPLOAD in Java, we map to file:upload
  async getUploadUrl(
    @Body() request: FileUploadUrlRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId =
      req.user.tenantId || (req.headers['x-tenant-id'] as string);
    const result = await this.fileService.generateUploadUrl(
      tenantId,
      req.user.userId,
      request,
    );
    return ApiResult.ok(result);
  }

  @Post(':id/confirm')
  @Permissions('file:upload')
  async confirmUpload(
    @Param('id') id: string,
    @Body() request: FileConfimRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId =
      req.user.tenantId || (req.headers['x-tenant-id'] as string);
    const file = await this.fileService.confirmUpload(
      tenantId,
      id,
      request.fileSize,
    );

    // Construct response matching Java FileUploadConfirmResponse
    const response: FileUploadConfirmResponse = {
      fileId: file.id,
      status: file.status,
      originalName: file.originalName,
      fileSize: Number(file.fileSize || 0),
      contentType: file.contentType || '',
      virusScanStatus: file.virusScanStatus,
      uploadedAt: file.updatedAt,
      message: '文件上传确认成功',
    };

    return ApiResult.ok(response);
  }

  @Get(':id/download-url')
  @Permissions('file:view')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId =
      req.user.tenantId || (req.headers['x-tenant-id'] as string);
    const result = await this.fileService.getDownloadUrl(tenantId, id);
    return ApiResult.ok(result);
  }

  @Post('batch-info')
  @Permissions('file:view')
  async getBatchInfo(@Body() request: FileBatchInfoRequest) {
    const result = await this.fileService.getBatchFileInfo(request.fileIds);
    return ApiResult.ok(result);
  }

  @Get('my')
  @Permissions('file:view')
  async listMyFiles(
    @Req() req: AuthenticatedRequest,
    @Query('page') page = '0',
    @Query('size') size = '10',
    @Query('status') status?: string,
  ) {
    return this.fileService.listMyFiles(req.user.userId, {
      page: Number(page),
      size: Number(size),
      status,
    });
  }

  @Get(':id')
  @Permissions('file:view')
  async getFileInfo(@Param('id') id: string) {
    const file = await this.fileService.findById(id);
    if (!file) throw new Error('File not found');

    const response: FileInfoResponse = {
      id: file.id,
      originalName: file.originalName,
      storedName: file.storedName,
      objectKey: file.objectKey,
      contentType: file.contentType || '',
      fileSize: Number(file.fileSize || 0),
      status: file.status,
      virusScanStatus: file.virusScanStatus,
      uploadedAt: file.createdAt,
    };

    return ApiResult.ok(response);
  }

  @Get(':id/preview-url')
  @Permissions('file:view')
  async getPreviewUrl(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const tenantId =
      req.user.tenantId || (req.headers['x-tenant-id'] as string);
    const result = await this.fileService.getPreviewUrl(tenantId, id);
    return ApiResult.ok(result);
  }

  @Delete(':id')
  @Permissions('file:delete')
  async deleteFile(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const tenantId =
      req.user.tenantId || (req.headers['x-tenant-id'] as string);
    await this.fileService.deleteFile(tenantId, id);
    return ApiResult.ok(null, '文件删除成功');
  }
}
