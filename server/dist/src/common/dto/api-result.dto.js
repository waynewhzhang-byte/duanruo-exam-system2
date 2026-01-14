"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResult = void 0;
class ApiResult {
    success;
    message;
    data;
    errorCode;
    timestamp;
    constructor(success, message, data, errorCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.timestamp = new Date().toISOString();
    }
    static ok(data, message = 'Success') {
        return new ApiResult(true, message, data);
    }
    static fail(message, errorCode) {
        return new ApiResult(false, message, undefined, errorCode);
    }
}
exports.ApiResult = ApiResult;
//# sourceMappingURL=api-result.dto.js.map