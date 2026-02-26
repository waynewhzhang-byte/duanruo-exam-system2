import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationPayload, NotificationProvider } from './notification.interface';
import { MockEmailProvider } from './email.provider';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private providers: Map<NotificationChannel, NotificationProvider> = new Map();

  constructor(emailProvider: MockEmailProvider) {
    this.providers.set(NotificationChannel.EMAIL, emailProvider);
  }

  /**
   * Send notification to a specific channel
   */
  async send(channel: NotificationChannel, payload: NotificationPayload): Promise<boolean> {
    const provider = this.providers.get(channel);
    if (!provider) {
      this.logger.error(`No provider found for channel: ${channel}`);
      return false;
    }

    try {
      return await provider.send(payload);
    } catch (error) {
      this.logger.error(`Failed to send notification via ${channel}: ${error.message}`);
      return false;
    }
  }

  /**
   * Helper for commonly used notifications
   */
  async notifyReviewResult(email: string, fullName: string, examTitle: string, status: string) {
    const isApproved = status === 'APPROVED' || status === 'PRIMARY_PASSED';
    await this.send(NotificationChannel.EMAIL, {
      to: email,
      subject: `考试报名审核结果通知 - ${examTitle}`,
      data: {
        fullName,
        examTitle,
        result: isApproved ? '通过' : '驳回',
        message: isApproved 
          ? '恭喜您，您的报名申请已通过审核。' 
          : '抱歉，您的报名申请未通过审核，请登录平台查看详情。',
      },
    });
  }

  async notifyTicketGenerated(email: string, fullName: string, examTitle: string, ticketNo: string) {
    await this.send(NotificationChannel.EMAIL, {
      to: email,
      subject: `准考证发放通知 - ${examTitle}`,
      data: {
        fullName,
        examTitle,
        ticketNo,
        message: '您的准考证已生成，请登录平台下载并打印。',
      },
    });
  }
}
