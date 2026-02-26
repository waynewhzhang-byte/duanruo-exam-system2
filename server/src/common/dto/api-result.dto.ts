export class ApiResult<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  timestamp: string;

  constructor(success: boolean, message: string, data?: T, code?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  static ok<T>(data?: T, message = 'Success'): ApiResult<T> {
    return new ApiResult(true, message, data);
  }

  static fail<T = never>(message: string, code?: string): ApiResult<T> {
    return new ApiResult<T>(false, message, undefined, code);
  }
}
