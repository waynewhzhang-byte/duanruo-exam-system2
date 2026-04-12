import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ApplicationService } from '../application/application.service';
import type { TicketService } from '../ticket/ticket.service';
import type { ScoreService } from './score.service';

describe('ExamController', () => {
  let controller: ExamController;

  const mockExamService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPositionService = {};
  const mockPrismaService = {};
  const mockApplicationService = {};
  const mockTicketService = {};
  const mockScoreService = {};

  beforeEach(() => {
    controller = new ExamController(
      mockExamService as unknown as ExamService,
      mockPositionService as never,
      mockPrismaService as unknown as PrismaService,
      mockApplicationService as unknown as ApplicationService,
      mockTicketService as unknown as TicketService,
      mockScoreService as unknown as ScoreService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
