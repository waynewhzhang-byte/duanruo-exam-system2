import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { ReviewService } from '../review/review.service';

describe('ApplicationController', () => {
  let controller: ApplicationController;

  const mockApplicationService = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findById: jest.fn(),
    submit: jest.fn(),
  };

  const mockReviewService = {
    pullTask: jest.fn(),
  };

  beforeEach(() => {
    controller = new ApplicationController(
      mockApplicationService as any,
      mockReviewService as any,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
