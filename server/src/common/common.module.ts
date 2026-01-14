import { Module, Global } from '@nestjs/common';
import { SecurityService } from './security/security.service';
import { PiiService } from './pii/pii.service';

@Global()
@Module({
  providers: [SecurityService, PiiService],
  exports: [SecurityService, PiiService],
})
export class CommonModule {}
