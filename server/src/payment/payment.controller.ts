import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
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
  @UseGuards(JwtAuthGuard)
  async queryOrder(@Param('orderId') orderId: string) {
    const result = await this.paymentService.queryOrder(orderId);
    return ApiResult.ok(result);
  }

  /**
   * 查询我的支付记录
   * GET /payments/my-orders
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async listMyOrders(@Request() req: any) {
    const candidateId = req.user.userId;
    const result = await this.paymentService.listMyOrders(candidateId);
    return ApiResult.ok(result);
  }
}
