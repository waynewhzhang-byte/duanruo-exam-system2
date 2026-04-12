import { ExamService } from './exam.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

describe('ExamService', () => {
  let service: ExamService;

  beforeEach(() => {
    service = new ExamService(
      {} as unknown as PrismaService,
      {} as unknown as UserService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
