/**
 * Safely parses a User roles JSON string into a string array.
 *
 * In Prisma, `User.roles` is stored as a `String` column containing a JSON
 * array (e.g. `'["CANDIDATE","TENANT_ADMIN"]'`).  Direct `JSON.parse(user.roles)`
 * is type-unsafe because the column can theoretically be null, undefined, or
 * contain malformed JSON.  This helper guards against all of those cases.
 *
 * @param roles - The raw `roles` value from the Prisma `User` model.
 * @returns A `string[]` parsed from the JSON string, or `[]` if parsing fails
 *          or the input is nullish / empty.
 */
export function parseUserRoles(roles: string | null | undefined): string[] {
  if (!roles) return [];
  try {
    const parsed: unknown = JSON.parse(roles);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}
