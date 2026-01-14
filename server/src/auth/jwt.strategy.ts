import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_SECRET') ||
        'exam-registration-jwt-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    await Promise.resolve(); // satisfying require-await
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
