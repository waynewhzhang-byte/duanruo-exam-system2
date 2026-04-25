/**
 * Idempotent seed: ensures a platform super-admin user exists in public.users.
 * Uses the same bcrypt cost as auth.service (10). Run after migrations.
 *
 * Required:
 *   SEED_SUPER_ADMIN_PASSWORD
 * Optional:
 *   SEED_SUPER_ADMIN_USERNAME  (default admin)
 *   SEED_SUPER_ADMIN_EMAIL     (default admin@duanruo.com)
 *   SEED_SUPER_ADMIN_FULL_NAME
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const username = process.env.SEED_SUPER_ADMIN_USERNAME ?? 'admin';
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@duanruo.com';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SEED_SUPER_ADMIN_FULL_NAME ?? 'System Administrator';

  if (!password) {
    throw new Error(
      'SEED_SUPER_ADMIN_PASSWORD is not set. Export it or run via deploy/install-and-deploy.sh (sets defaults).',
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const rolesJson = JSON.stringify([...ROLES]);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        email,
        passwordHash,
        fullName: existing.fullName || fullName,
        roles: rolesJson,
        status: 'ACTIVE',
      },
    });
    // eslint-disable-next-line no-console
    console.log(
      `seed-super-admin: updated user id=${existing.id} (username=${username}, email=${email})`,
    );
  } else {
    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        roles: rolesJson,
        status: 'ACTIVE',
      },
    });
    // eslint-disable-next-line no-console
    console.log(
      `seed-super-admin: created user (username=${username}, email=${email})`,
    );
  }
}

void main()
  .catch((e: unknown) => {
    console.error('seed-super-admin failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
