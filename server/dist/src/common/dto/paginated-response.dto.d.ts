export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
export declare class PaginationHelper {
    static createResponse<T>(items: T[], total: number, page: number, size: number): PaginatedResponse<T>;
}
