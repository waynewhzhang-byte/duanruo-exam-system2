import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../utils/error.util';

export interface AuditLogInput {
  userId?: string;
  username?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      const userId =
        input.userId && input.userId.trim().length > 0
          ? input.userId
          : undefined;
      await this.prisma.securityAuditLog.create({
        data: {
          userId,
          username: input.username,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          details: input.details as Prisma.InputJsonValue,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          success: input.success ?? true,
          errorMessage: input.errorMessage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${getErrorMessage(error)}`);
    }
  }

  async logLogin(params: {
    userId: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      username: params.username,
      action: 'USER_LOGIN',
      resource: 'auth',
      success: params.success,
      errorMessage: params.errorMessage,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logLogout(params: {
    userId: string;
    username: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      username: params.username,
      action: 'USER_LOGOUT',
      resource: 'auth',
      ipAddress: params.ipAddress,
    });
  }

  async logUserCreate(params: {
    actorId: string;
    actorUsername: string;
    targetUserId: string;
    targetUsername: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.actorId,
      username: params.actorUsername,
      action: 'USER_CREATE',
      resource: 'user',
      resourceId: params.targetUserId,
      details: { targetUsername: params.targetUsername },
      ipAddress: params.ipAddress,
    });
  }

  async logUserUpdate(params: {
    actorId: string;
    actorUsername: string;
    targetUserId: string;
    changes: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.actorId,
      username: params.actorUsername,
      action: 'USER_UPDATE',
      resource: 'user',
      resourceId: params.targetUserId,
      details: params.changes,
      ipAddress: params.ipAddress,
    });
  }

  async logUserDelete(params: {
    actorId: string;
    actorUsername: string;
    targetUserId: string;
    targetUsername: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.actorId,
      username: params.actorUsername,
      action: 'USER_DELETE',
      resource: 'user',
      resourceId: params.targetUserId,
      details: { targetUsername: params.targetUsername },
      ipAddress: params.ipAddress,
    });
  }

  async logTenantCreate(params: {
    actorId: string;
    actorUsername: string;
    tenantId: string;
    tenantName: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.actorId,
      username: params.actorUsername,
      action: 'TENANT_CREATE',
      resource: 'tenant',
      resourceId: params.tenantId,
      details: { tenantName: params.tenantName },
      ipAddress: params.ipAddress,
    });
  }

  async logTenantDelete(params: {
    actorId: string;
    actorUsername: string;
    tenantId: string;
    tenantName: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.log({
      userId: params.actorId,
      username: params.actorUsername,
      action: 'TENANT_DELETE',
      resource: 'tenant',
      resourceId: params.tenantId,
      details: { tenantName: params.tenantName },
      ipAddress: params.ipAddress,
    });
  }
}
