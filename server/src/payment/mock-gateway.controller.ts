import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Body,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MockGatewayService } from './mock-gateway.service';
import { ConfigService } from '@nestjs/config';

/**
 * Mock支付网关控制器
 * 提供模拟支付页面和支付操作接口
 */
@Controller('mock-pay')
export class MockGatewayController {
  private readonly logger = new Logger(MockGatewayController.name);
  private readonly serverUrl: string;

  constructor(
    private readonly mockGateway: MockGatewayService,
    private readonly config: ConfigService,
  ) {
    this.serverUrl =
      this.config.get<string>('SERVER_URL') || 'http://localhost:3000';
  }

  /**
   * 显示Mock支付页面
   * GET /mock-pay/:outTradeNo
   */
  @Get(':outTradeNo')
  async showPaymentPage(
    @Param('outTradeNo') outTradeNo: string,
    @Res() res: Response,
  ) {
    const order = this.mockGateway.getOrderInfo(outTradeNo);

    if (!order) {
      throw new NotFoundException('支付订单不存在或已过期');
    }

    const html = this.generatePaymentPageHTML(order);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  /**
   * 处理支付操作（支付成功/失败）
   * POST /mock-pay/action/:outTradeNo
   */
  @Post('action/:outTradeNo')
  async handlePaymentAction(
    @Param('outTradeNo') outTradeNo: string,
    @Body() body: { action: 'success' | 'failed' },
  ) {
    const { action } = body;
    const callbackUrl = `${this.serverUrl}/payments/callback`;

    try {
      if (action === 'success') {
        const result =
          await this.mockGateway.mockPaymentSuccess(outTradeNo, callbackUrl);
        return {
          success: true,
          message: '支付成功',
          result,
        };
      } else {
        const result =
          await this.mockGateway.mockPaymentFailed(outTradeNo, callbackUrl);
        return {
          success: true,
          message: '支付失败',
          result,
        };
      }
    } catch (error) {
      this.logger.error(`Payment action failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 生成支付页面HTML
   */
  private generatePaymentPageHTML(order: {
    outTradeNo: string;
    amount: number;
    currency: string;
    description: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock支付页面</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 100%;
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }

    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .header p {
      font-size: 14px;
      opacity: 0.9;
    }

    .content {
      padding: 32px 24px;
    }

    .order-info {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      color: #718096;
    }

    .value {
      color: #2d3748;
      font-weight: 500;
    }

    .amount {
      text-align: center;
      margin: 24px 0;
    }

    .amount-label {
      font-size: 14px;
      color: #718096;
      margin-bottom: 8px;
    }

    .amount-value {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
    }

    .amount-currency {
      font-size: 24px;
      margin-left: 8px;
    }

    .buttons {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    button {
      flex: 1;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    button:active {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-success {
      background: #48bb78;
      color: white;
    }

    .btn-success:hover {
      background: #38a169;
    }

    .btn-fail {
      background: #f56565;
      color: white;
    }

    .btn-fail:hover {
      background: #e53e3e;
    }

    .notice {
      background: #fef5e7;
      border-left: 4px solid #f39c12;
      padding: 12px 16px;
      margin-top: 24px;
      border-radius: 4px;
      font-size: 13px;
      color: #7d6608;
    }

    .loading {
      display: none;
      text-align: center;
      margin-top: 16px;
      color: #718096;
      font-size: 14px;
    }

    .loading.active {
      display: block;
    }

    .result {
      display: none;
      padding: 16px;
      margin-top: 16px;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    }

    .result.active {
      display: block;
    }

    .result.success {
      background: #c6f6d5;
      color: #22543d;
    }

    .result.error {
      background: #fed7d7;
      color: #742a2a;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Mock支付网关</h1>
      <p>测试环境 - 模拟支付流程</p>
    </div>

    <div class="content">
      <div class="order-info">
        <div class="info-row">
          <span class="label">订单号</span>
          <span class="value">${order.outTradeNo}</span>
        </div>
        <div class="info-row">
          <span class="label">商品描述</span>
          <span class="value">${order.description}</span>
        </div>
        <div class="info-row">
          <span class="label">币种</span>
          <span class="value">${order.currency}</span>
        </div>
      </div>

      <div class="amount">
        <div class="amount-label">应付金额</div>
        <div class="amount-value">
          ¥${order.amount.toFixed(2)}
        </div>
      </div>

      <div class="buttons">
        <button class="btn-success" onclick="handlePayment('success')">
          ✅ 支付成功
        </button>
        <button class="btn-fail" onclick="handlePayment('failed')">
          ❌ 支付失败
        </button>
      </div>

      <div class="loading" id="loading">
        处理中，请稍候...
      </div>

      <div class="result" id="result"></div>

      <div class="notice">
        ⚠️ 这是测试环境的模拟支付页面。点击按钮后将自动触发回调通知业务系统。
      </div>
    </div>
  </div>

  <script>
    async function handlePayment(action) {
      const buttons = document.querySelectorAll('button');
      const loading = document.getElementById('loading');
      const result = document.getElementById('result');

      // 禁用按钮
      buttons.forEach(btn => btn.disabled = true);

      // 显示加载状态
      loading.classList.add('active');
      result.classList.remove('active');

      try {
        const response = await fetch('/mock-pay/action/${order.outTradeNo}', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        const data = await response.json();

        // 隐藏加载状态
        loading.classList.remove('active');

        // 显示结果
        result.classList.add('active');
        if (data.success) {
          result.classList.add('success');
          result.classList.remove('error');
          result.innerHTML = \`
            ✅ \${data.message}<br>
            <small>3秒后自动关闭...</small>
          \`;

          // 3秒后关闭页面
          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          result.classList.add('error');
          result.classList.remove('success');
          result.innerHTML = \`❌ 操作失败: \${data.message}\`;

          // 重新启用按钮
          setTimeout(() => {
            buttons.forEach(btn => btn.disabled = false);
          }, 2000);
        }
      } catch (error) {
        // 隐藏加载状态
        loading.classList.remove('active');

        // 显示错误
        result.classList.add('active', 'error');
        result.classList.remove('success');
        result.innerHTML = '❌ 网络错误，请重试';

        // 重新启用按钮
        setTimeout(() => {
          buttons.forEach(btn => btn.disabled = false);
        }, 2000);
      }
    }
  </script>
</body>
</html>
    `.trim();
  }
}
