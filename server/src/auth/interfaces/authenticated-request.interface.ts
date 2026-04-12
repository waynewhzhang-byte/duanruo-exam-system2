import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  tenantId?: string;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  /** Set by TenantMiddleware when X-Tenant-ID or X-Tenant-Slug is present */
  tenantSchema?: string;
}
