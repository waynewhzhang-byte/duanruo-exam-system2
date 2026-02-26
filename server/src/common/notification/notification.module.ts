import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MockEmailProvider } from './email.provider';

@Global()
@Module({
  providers: [NotificationService, MockEmailProvider],
  exports: [NotificationService],
})
export class NotificationModule {}
