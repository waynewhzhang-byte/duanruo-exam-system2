import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginRequestDto, SelectTenantDto } from './dto/auth.dto';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: LoginRequestDto) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user);
    return ApiResult.ok(result);
  }

  @Post('select-tenant')
  @UseGuards(JwtAuthGuard)
  async selectTenant(
    @Body() body: SelectTenantDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.authService.selectTenant(
      req.user.userId,
      body.tenantId,
    );
    return ApiResult.ok(result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    // req.user contains the decoded JWT
    // We should return a full user response
    const user = await this.authService.getMe(req.user.userId);
    return ApiResult.ok(user);
  }

  @Post('logout')
  logout() {
    return ApiResult.ok(null, 'Logged out');
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: AuthenticatedRequest) {
    const result = await this.authService.refreshToken(req.user.userId);
    return ApiResult.ok(result);
  }
}
