import { UserController } from './user.controller';
import type { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(() => {
    controller = new UserController({} as unknown as UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
