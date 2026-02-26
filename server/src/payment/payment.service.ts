import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockGatewayService } from './mock-gateway.service';
import {
  InitiatePaymentRequest,
  PaymentChannel,
  PaymentCallbackRequest,
} from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockGateway: MockGatewayService,
  ) {}

  private get client() {
    return this.prisma.client;
  }

  async initiate(request: InitiatePaymentRequest) {
    const { applicationId, channel } = request;

    const app = await this.client.application.findUnique({
      where: { id: applicationId },
      include: { exam: true },
    });

    if (!app) throw new NotFoundException('Application not found');

    // ✅ 核心修改：只有审核通过（APPROVED）的报名才能支付
    if (app.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only approved applications can initiate payment',
      );
    }

    // 检查考试是否需要收费
    if (!app.exam.feeRequired) {
      throw new BadRequestException('This exam does not require payment');
    }

    const amount = app.exam.feeAmount ? Number(app.exam.feeAmount) : 0;
    if (amount <= 0) {
      throw new BadRequestException('Fee amount is not set');
    }

    // 检查是否已经有待支付或已支付的订单
    const existingOrder = await this.client.paymentOrder.findFirst({
      where: {
        applicationId,
        status: { in: ['PENDING', 'SUCCESS'] },
      },
    });

    if (existingOrder) {
      if (existingOrder.status === 'SUCCESS') {
        throw new BadRequestException('Payment already completed');
      }
      // 如果有待支付订单，返回现有订单信息
      return {
        orderId: existingOrder.id,
        outTradeNo: existingOrder.outTradeNo,
        payUrl:
          existingOrder.channel === 'MOCK'
            ? await this.getMockPayUrl(existingOrder.outTradeNo)
            : null,
        status: existingOrder.status,
        expiredAt: existingOrder.expiredAt,
      };
    }

    const outTradeNo = `PO-${Date.now()}-${applicationId.substring(0, 8)}`;

    // Set expiration time (30 minutes)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 30);

    const order = await this.client.paymentOrder.create({
      data: {
        id: uuidv4(),
        applicationId,
        outTradeNo,
        amount,
        currency: 'CNY',
        channel,
        status: 'PENDING',
        expiredAt,
      },
    });

    // Handle MOCK channel
    if (channel === PaymentChannel.MOCK) {
      const mockResult = await this.mockGateway.createOrder({
        outTradeNo,
        amount,
        currency: 'CNY',
        description: `${app.exam.title} - 报名费`,
      });

      this.logger.log(
        `Mock payment initiated: ${outTradeNo}, amount: ${amount}`,
      );

      return {
        orderId: order.id,
        outTradeNo,
        payUrl: mockResult.payUrl,
        qrCode: mockResult.qrCode,
        status: order.status,
        expiredAt,
      };
    }

    // Real gateways would be implemented here
    throw new BadRequestException(`Channel ${channel} not implemented yet`);
  }

  async handleCallback(request: PaymentCallbackRequest) {
    const { outTradeNo, transactionId, status } = request;

    const order = await this.client.paymentOrder.findUnique({
      where: { outTradeNo },
    });

    if (!order) throw new NotFoundException('Payment order not found');

    if (order.status === 'SUCCESS') {
      return { success: true, message: 'Already processed' };
    }

    const newStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

    return await this.client.$transaction(async (tx) => {
      // 1) Update Payment Order
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          transactionId: transactionId || `MOCK-TX-${Date.now()}`,
          paidAt: newStatus === 'SUCCESS' ? new Date() : null,
          callbackData: JSON.stringify(request),
        },
      });

      // 2) ✅ 核心修改：支付成功后只更新报名状态为 PAID，不触发任何其他动作
      if (newStatus === 'SUCCESS') {
        const app = await tx.application.findUnique({
          where: { id: order.applicationId },
        });

        if (app) {
          // 只更新状态，不触发审核或准考证生成
          await tx.application.update({
            where: { id: app.id },
            data: { status: 'PAID' },
          });

          // 记录审计日志
          await tx.applicationAuditLog.create({
            data: {
              id: uuidv4(),
              applicationId: app.id,
              fromStatus: app.status,
              toStatus: 'PAID',
              actor: 'SYSTEM',
              reason: 'Payment successful',
              metadata: {
                orderId: order.id,
                outTradeNo: order.outTradeNo,
                transactionId: transactionId,
                amount: order.amount.toString(),
              },
            },
          });

          this.logger.log(
            `Application ${app.id} payment completed, status: APPROVED -> PAID`,
          );
        }
      }

      return { success: true, status: newStatus };
    });
  }

  /**
   * 获取Mock支付URL的辅助方法
   */
  private async getMockPayUrl(outTradeNo: string): Promise<string> {
    const baseUrl =
      process.env.SERVER_URL || 'http://localhost:3000';
    return `${baseUrl}/mock-pay/${outTradeNo}`;
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderId: string) {
    const order = await this.client.paymentOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      applicationId: order.applicationId,
      amount: Number(order.amount),
      currency: order.currency,
      channel: order.channel,
      status: order.status,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
      expiredAt: order.expiredAt,
      createdAt: order.createdAt,
    };
  }

  /**
   * 查询考生的支付订单列表
   */
  async listMyOrders(candidateId: string) {
    const applications = await this.client.application.findMany({
      where: { candidateId },
      select: { id: true },
    });

    const applicationIds = applications.map((a) => a.id);

    const orders = await this.client.paymentOrder.findMany({
      where: {
        applicationId: { in: applicationIds },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      orderId: order.id,
      outTradeNo: order.outTradeNo,
      applicationId: order.applicationId,
      amount: Number(order.amount),
      currency: order.currency,
      channel: order.channel,
      status: order.status,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    }));
  }
}
