"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationHelper = void 0;
class PaginationHelper {
    static createResponse(items, total, page, size) {
        return {
            content: items,
            totalElements: total,
            totalPages: Math.ceil(total / size),
            size,
            number: page,
        };
    }
}
exports.PaginationHelper = PaginationHelper;
//# sourceMappingURL=paginated-response.dto.js.map