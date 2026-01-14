import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Mock支付网关服务
 * 用于测试环境模拟支付宝/微信支付流程
 */
@Injectable()
export class MockGatewayService {
  private readonly logger = new Logger(MockGatewayService.name);
  private readonly baseUrl: string;

  // 临时存储订单信息（生产环境应使用Redis）
  private readonly orderCache = new Map<
    string,
    {
      outTradeNo: string;
      amount: number;
      currency: string;
      description: string;
      createdAt: Date;
    }
  >();

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>('SERVER_URL') || 'http://localhost:3000';
  }

  /**
   * 创建Mock支付订单
   */
  async createOrder(params: {
    outTradeNo: string;
    amount: number;
    currency: string;
    description?: string;
  }) {
    const { outTradeNo, amount, currency, description } = params;

    // 存储订单信息
    this.orderCache.set(outTradeNo, {
      outTradeNo,
      amount,
      currency,
      description: description || '考试报名费',
      createdAt: new Date(),
    });

    // 设置5分钟后自动清理
    setTimeout(() => {
      this.orderCache.delete(outTradeNo);
    }, 5 * 60 * 1000);

    this.logger.log(`Mock order created: ${outTradeNo}, amount: ${amount}`);

    // 返回支付页面URL
    return {
      payUrl: `${this.baseUrl}/mock-pay/${outTradeNo}`,
      outTradeNo,
      qrCode: `${this.baseUrl}/mock-pay/qr/${outTradeNo}`, // 可选：二维码支付
    };
  }

  /**
   * 获取订单信息（用于支付页面展示）
   */
  getOrderInfo(outTradeNo: string) {
    const order = this.orderCache.get(outTradeNo);
    if (!order) {
      return null;
    }

    // 检查是否过期（5分钟）
    const elapsed = Date.now() - order.createdAt.getTime();
    if (elapsed > 5 * 60 * 1000) {
      this.orderCache.delete(outTradeNo);
      return null;
    }

    return order;
  }

  /**
   * 模拟支付成功回调
   */
  async mockPaymentSuccess(outTradeNo: string, callbackUrl: string) {
    const order = this.orderCache.get(outTradeNo);
    if (!order) {
      throw new Error('Order not found or expired');
    }

    const transactionId = `MOCK-TX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.logger.log(
      `Mock payment SUCCESS: ${outTradeNo}, txId: ${transactionId}`,
    );

    // 发送回调到业务系统
    return await this.sendCallback(callbackUrl, {
      outTradeNo,
      transactionId,
      status: 'SUCCESS',
      amount: order.amount,
      currency: order.currency,
      paidAt: new Date().toISOString(),
    });
  }

  /**
   * 模拟支付失败回调
   */
  async mockPaymentFailed(outTradeNo: string, callbackUrl: string) {
    const order = this.orderCache.get(outTradeNo);
    if (!order) {
      throw new Error('Order not found or expired');
    }

    this.logger.warn(`Mock payment FAILED: ${outTradeNo}`);

    return await this.sendCallback(callbackUrl, {
      outTradeNo,
      transactionId: null,
      status: 'FAILED',
      amount: order.amount,
      currency: order.currency,
      failureReason: 'User cancelled payment',
    });
  }

  /**
   * 发送HTTP回调
   */
  private async sendCallback(url: string, data: any) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      this.logger.log(`Callback sent to ${url}, result:`, result);

      return result;
    } catch (error) {
      this.logger.error(`Callback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清理过期订单（定时任务调用）
   */
  cleanExpiredOrders() {
    const now = Date.now();
    let cleaned = 0;

    for (const [outTradeNo, order] of this.orderCache.entries()) {
      const elapsed = now - order.createdAt.getTime();
      if (elapsed > 5 * 60 * 1000) {
        this.orderCache.delete(outTradeNo);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired mock orders`);
    }
  }
}
