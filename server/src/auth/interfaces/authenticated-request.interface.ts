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
}
