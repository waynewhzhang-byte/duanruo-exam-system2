import { UserService } from './user.service';
import { ApiResult } from '../common/dto/api-result.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getMe(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/user.dto").UserResponse>>;
    getMyTenants(req: AuthenticatedRequest): Promise<ApiResult<import("./dto/user.dto").UserTenantRoleResponse[]>>;
}
