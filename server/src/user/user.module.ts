import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProfileModule } from './profile.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PiiModule } from '../common/pii/pii.module';

@Module({
  imports: [PrismaModule, PiiModule, ProfileModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, ProfileModule],
})
export class UserModule {}
