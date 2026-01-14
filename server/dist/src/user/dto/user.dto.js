"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTenantRoleResponse = exports.TenantResponse = exports.UserResponse = void 0;
class UserResponse {
    id;
    username;
    email;
    fullName;
    phoneNumber;
    status;
    roles;
    createdAt;
}
exports.UserResponse = UserResponse;
class TenantResponse {
    id;
    name;
    code;
    schemaName;
    status;
    contactEmail;
    contactPhone;
    createdAt;
}
exports.TenantResponse = TenantResponse;
class UserTenantRoleResponse {
    id;
    userId;
    tenantId;
    role;
    active;
    tenant;
}
exports.UserTenantRoleResponse = UserTenantRoleResponse;
//# sourceMappingURL=user.dto.js.map