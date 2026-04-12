import { UserService } from './user.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService({} as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
