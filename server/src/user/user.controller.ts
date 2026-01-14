import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findById(req.user.userId);
    return ApiResult.ok(user);
  }

  @Get('me/tenants')
  async getMyTenants(@Req() req: AuthenticatedRequest) {
    const tenants = await this.userService.findMyTenants(req.user.userId);
    return ApiResult.ok(tenants);
  }
}
