import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { ApiResult } from '../common/dto/api-result.dto';

@Controller('positions')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Get(':id/form-template')
  @Permissions('position:view')
  async getFormTemplate(@Param('id') id: string) {
    const data = await this.positionService.getExamFormTemplateForPosition(id);
    return ApiResult.ok(data);
  }

  @Get(':id/applications')
  @Permissions('application:view:all')
  async listApplications(@Param('id') id: string) {
    const apps = await this.positionService.listApplicationsForPosition(id);
    return ApiResult.ok(apps);
  }

  @Get(':id')
  @Permissions('position:view')
  async getById(@Param('id') id: string) {
    const position = await this.positionService.findById(id);
    return ApiResult.ok(position);
  }

  @Put(':id')
  @Permissions('position:edit')
  async update(
    @Param('id') id: string,
    @Body()
    request: {
      title?: string;
      description?: string;
      requirements?: string;
      quota?: number;
    },
  ) {
    const position = await this.positionService.update(id, request);
    return ApiResult.ok(position, 'Position updated successfully');
  }

  @Delete(':id')
  @Permissions('position:delete')
  async delete(@Param('id') id: string) {
    await this.positionService.delete(id);
    return ApiResult.ok(null, 'Position deleted successfully');
  }
}
