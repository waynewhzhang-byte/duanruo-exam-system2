export declare class ApiResult<T> {
    success: boolean;
    message: string;
    data?: T;
    errorCode?: string;
    timestamp: string;
    constructor(success: boolean, message: string, data?: T, errorCode?: string);
    static ok<T>(data?: T, message?: string): ApiResult<T>;
    static fail<T = never>(message: string, errorCode?: string): ApiResult<T>;
}
