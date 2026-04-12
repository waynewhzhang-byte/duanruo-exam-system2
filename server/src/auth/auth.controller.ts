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
import { AuditService } from '../common/security/audit.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginRequestDto, SelectTenantDto } from './dto/auth.dto';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import type { Request } from 'express';

function getRequestIp(req: Request): string | undefined {
  const fromIp = req.ip;
  if (typeof fromIp === 'string' && fromIp.length > 0) return fromIp;
  const fromSocket = req.socket?.remoteAddress;
  return typeof fromSocket === 'string' && fromSocket.length > 0
    ? fromSocket
    : undefined;
}

function getUserAgent(req: Request): string | undefined {
  return req.get('user-agent') ?? undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('login')
  async login(@Body() body: LoginRequestDto, @Req() req: Request) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      await this.auditService.logLogin({
        userId: '',
        username: body.username,
        success: false,
        errorMessage: 'Invalid credentials',
        ipAddress: getRequestIp(req),
        userAgent: getUserAgent(req),
      });
      throw new UnauthorizedException('Invalid credentials');
    }
    const result = await this.authService.login(user);
    await this.auditService.logLogin({
      userId: user.id,
      username: user.username,
      success: true,
      ipAddress: getRequestIp(req),
      userAgent: getUserAgent(req),
    });
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
    const user = await this.authService.getMe(
      req.user.userId,
      req.user.tenantId,
    );
    return ApiResult.ok(user);
  }

  @Post('logout')
  logout() {
    return ApiResult.ok(null, 'Logged out');
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: AuthenticatedRequest) {
    const result = await this.authService.refreshToken(
      req.user.userId,
      req.user.tenantId,
    );
    return ApiResult.ok(result);
  }
}
