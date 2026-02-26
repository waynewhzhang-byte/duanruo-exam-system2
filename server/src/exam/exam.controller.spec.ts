import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamController', () => {
  let controller: ExamController;
  let service: ExamService;

  const mockExamService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPositionService = {};
  const mockPrismaService = {};

  beforeEach(() => {
    controller = new ExamController(
      mockExamService as unknown as ExamService,
      mockPositionService as never,
      mockPrismaService as unknown as PrismaService,
    );
    service = mockExamService as unknown as ExamService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
