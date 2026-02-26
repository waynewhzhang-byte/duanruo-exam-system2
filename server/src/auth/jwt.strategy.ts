import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './interfaces/authenticated-request.interface';

interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  tenantId?: string;
  roles: string[];
  permissions: string[];
}

const logger = new Logger('JwtStrategy');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    
    if (!secret && configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production.');
    }
    
    if (!secret) {
      logger.warn('Using default JWT secret - only for development!');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'dev-only-jwt-secret-change-in-production-do-not-use',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    await Promise.resolve();
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      tenantId: payload.tenantId,
      roles: payload.roles || [],
      permissions: payload.permissions || [],
    };
  }
}
