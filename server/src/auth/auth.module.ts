import { Module, Logger } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { PermissionsAnyGuard } from './permissions-any.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

const logger = new Logger('AuthModule');

function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  if (!secret) {
    if (nodeEnv === 'production') {
      throw new Error(
        'JWT_SECRET environment variable is required in production. ' +
          'Please set a secure random string (at least 32 characters).',
      );
    }

    logger.warn(
      '⚠️  Using default JWT secret. This is insecure and should only be used in development. ' +
        'Set JWT_SECRET environment variable for production.',
    );
    return 'dev-only-jwt-secret-change-in-production-do-not-use';
  }

  if (secret.length < 32) {
    logger.warn(
      `JWT_SECRET is only ${secret.length} characters. ` +
        'Consider using a longer secret (at least 32 characters) for better security.',
    );
  }

  return secret;
}

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '86400s');
        return {
          secret: getJwtSecret(configService),
          signOptions: { expiresIn: expiresIn as never },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, PermissionsAnyGuard],
  controllers: [AuthController],
  exports: [AuthService, PermissionsAnyGuard],
})
export class AuthModule {}
