import { ExamService } from './exam.service';

describe('ExamService', () => {
  let service: ExamService;

  beforeEach(() => {
    service = new ExamService({} as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
