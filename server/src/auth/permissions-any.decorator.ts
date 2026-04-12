import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_ANY_KEY = 'permissionsAny';

/** User must have at least one of the listed permissions (OR). */
export const PermissionsAny = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
