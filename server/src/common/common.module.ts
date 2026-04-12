import { Module, Global } from '@nestjs/common';
import { SecurityService } from './security/security.service';
import { PiiService } from './pii/pii.service';
import { AuditService } from './security/audit.service';

@Global()
@Module({
  providers: [SecurityService, PiiService, AuditService],
  exports: [SecurityService, PiiService, AuditService],
})
export class CommonModule {}
