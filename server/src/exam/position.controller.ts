import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PositionService } from './position.service';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { ApiResult } from '../common/dto/api-result.dto';

@Controller('positions')
@UseGuards(PermissionsGuard)
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

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
    @Body() request: {
      title?: string;
      description?: string;
      requirements?: any;
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
