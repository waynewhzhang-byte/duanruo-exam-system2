export declare class UserResponse {
    id: string;
    username: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    status: string;
    roles: string[];
    createdAt: Date;
}
export declare class TenantResponse {
    id: string;
    name: string;
    code: string;
    schemaName: string;
    status: string;
    contactEmail: string;
    contactPhone?: string;
    createdAt: Date;
}
export declare class UserTenantRoleResponse {
    id: string;
    userId: string;
    tenantId: string;
    role: string;
    active: boolean;
    tenant?: TenantResponse;
}
