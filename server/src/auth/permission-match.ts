/**
 * Shared permission matching (wildcards) for PermissionsGuard and PermissionsAnyGuard.
 */
export function permissionMatches(
  userPerm: string,
  requiredPerm: string,
): boolean {
  if (userPerm === requiredPerm) {
    return true;
  }
  if (userPerm === '*') {
    return true;
  }
  const requiredParts = requiredPerm.split(':');
  const userParts = userPerm.split(':');
  if (userParts.length === 2 && userParts[1] === '*') {
    return userParts[0] === requiredParts[0];
  }
  if (userParts.length > requiredParts.length) {
    return false;
  }
  for (let i = 0; i < userParts.length; i++) {
    if (userParts[i] === '*') {
      return true;
    }
    if (userParts[i] !== requiredParts[i]) {
      return false;
    }
  }
  return false;
}
