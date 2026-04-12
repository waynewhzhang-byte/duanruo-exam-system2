import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutoReviewService } from '../review/auto-review.service';

describe('ApplicationService', () => {
  let service: ApplicationService;

  beforeEach(() => {
    const prisma = {
      client: {
        exam: { findUnique: jest.fn() },
        application: {
          upsert: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
        },
      },
    } as unknown as PrismaService;

    const autoReview = {} as AutoReviewService;

    service = new ApplicationService(prisma, autoReview);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
