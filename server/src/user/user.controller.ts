import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Permissions('session:user:read')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findById(req.user.userId);
    return ApiResult.ok(user);
  }

  @Get('me/tenants')
  @Permissions('session:tenants:list')
  async getMyTenants(@Req() req: AuthenticatedRequest) {
    const tenants = await this.userService.findMyTenants(req.user.userId);
    return ApiResult.ok(tenants);
  }
}
