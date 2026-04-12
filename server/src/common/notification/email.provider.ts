import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from './notification.interface';

@Injectable()
export class MockEmailProvider implements NotificationProvider {
  private readonly logger = new Logger('EmailProvider');

  getChannel(): NotificationChannel {
    return NotificationChannel.EMAIL;
  }

  send(payload: NotificationPayload): Promise<boolean> {
    this.logger.log(`[MOCK EMAIL SENT]
      To: ${payload.to}
      Subject: ${payload.subject || 'System Notification'}
      Body: ${JSON.stringify(payload.data)}
    `);
    // In production, use nodemailer or a service like SendGrid
    return Promise.resolve(true);
  }
}
