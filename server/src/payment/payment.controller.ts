import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { PaymentService } from './payment.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { PermissionsAnyGuard } from '../auth/permissions-any.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsAny } from '../auth/permissions-any.decorator';
import {
  InitiatePaymentRequest,
  PaymentCallbackRequest,
} from './dto/payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * 发起支付
   * POST /payments/initiate
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @Permissions('payment:initiate')
  async initiate(@Body() request: InitiatePaymentRequest) {
    const result = await this.paymentService.initiate(request);
    return ApiResult.ok(result);
  }

  /**
   * 支付回调（由支付网关调用）
   * POST /payments/callback
   */
  @Post('callback')
  async callback(@Body() request: PaymentCallbackRequest) {
    const result = await this.paymentService.handleCallback(request);
    return ApiResult.ok(result);
  }

  /**
   * 查询订单详情
   * GET /payments/order/:orderId
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsAnyGuard)
  @PermissionsAny('payment:view:own', 'payment:order:read')
  async queryOrder(
    @Param('orderId') orderId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.paymentService.queryOrder(orderId, req.user);
    return ApiResult.ok(result);
  }

  /**
   * 查询我的支付记录
   * GET /payments/my-orders
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @Permissions('payment:view:own')
  async listMyOrders(@Req() req: AuthenticatedRequest) {
    const candidateId = req.user.userId;
    const result = await this.paymentService.listMyOrders(candidateId);
    return ApiResult.ok(result);
  }
}
