"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidator = void 0;
class FileValidator {
    static ALLOWED_EXTENSIONS = new Set([
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'bmp',
        'txt',
        'zip',
        'rar',
    ]);
    static DANGEROUS_EXTENSIONS = new Set([
        'exe',
        'bat',
        'cmd',
        'com',
        'pif',
        'scr',
        'vbs',
        'js',
        'jar',
        'sh',
        'ps1',
        'msi',
        'dll',
        'so',
        'dylib',
    ]);
    static SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9_\-.\u4e00-\u9fa5]+$/;
    static MAX_FILENAME_LENGTH = 255;
    static DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
    static MAGIC_NUMBERS = {
        pdf: [0x25, 0x50, 0x44, 0x46],
        jpg: [0xff, 0xd8, 0xff],
        jpeg: [0xff, 0xd8, 0xff],
        png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        gif: [0x47, 0x49, 0x46, 0x38],
        zip: [0x50, 0x4b, 0x03, 0x04],
        docx: [0x50, 0x4b, 0x03, 0x04],
        xlsx: [0x50, 0x4b, 0x03, 0x04],
        doc: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
        xls: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
    };
    static validateFileName(fileName) {
        if (!fileName || fileName.trim().length === 0) {
            return {
                valid: false,
                errorMessage: '文件名不能为空',
                errors: ['文件名不能为空'],
            };
        }
        if (fileName.includes('/') || fileName.includes('\\')) {
            return {
                valid: false,
                errorMessage: '文件名不能包含路径分隔符',
                errors: ['文件名不能包含路径分隔符'],
            };
        }
        const cleanFileName = fileName;
        if (cleanFileName.length > this.MAX_FILENAME_LENGTH) {
            return {
                valid: false,
                errorMessage: `文件名过长（最大${this.MAX_FILENAME_LENGTH}字符）`,
                errors: [`文件名过长（最大${this.MAX_FILENAME_LENGTH}字符）`],
            };
        }
        if (!this.SAFE_FILENAME_PATTERN.test(cleanFileName)) {
            return {
                valid: false,
                errorMessage: '文件名包含非法字符',
                errors: ['文件名包含非法字符'],
            };
        }
        const dotCount = (cleanFileName.match(/\./g) || []).length;
        if (dotCount > 1) {
            return {
                valid: false,
                errorMessage: '文件名不能包含多个点',
                errors: ['文件名不能包含多个点'],
            };
        }
        return { valid: true, errors: [] };
    }
    static validateFileExtension(fileName, allowedExtensions) {
        const extension = this.getFileExtension(fileName);
        if (!extension) {
            return {
                valid: false,
                errorMessage: '文件必须有扩展名',
                errors: ['文件必须有扩展名'],
            };
        }
        if (this.DANGEROUS_EXTENSIONS.has(extension)) {
            return {
                valid: false,
                errorMessage: '禁止上传可执行文件',
                errors: ['禁止上传可执行文件'],
            };
        }
        if (allowedExtensions && allowedExtensions.length > 0) {
            if (!allowedExtensions.includes(extension)) {
                return {
                    valid: false,
                    errorMessage: `不支持的文件类型: ${extension}，允许的类型: ${allowedExtensions.join(', ')}`,
                    errors: [
                        `不支持的文件类型: ${extension}，允许的类型: ${allowedExtensions.join(', ')}`,
                    ],
                };
            }
        }
        else if (!this.ALLOWED_EXTENSIONS.has(extension)) {
            return {
                valid: false,
                errorMessage: `不支持的文件类型: ${extension}`,
                errors: [`不支持的文件类型: ${extension}`],
            };
        }
        return { valid: true, errors: [] };
    }
    static validateFileSize(fileSize, maxSize = this.DEFAULT_MAX_FILE_SIZE) {
        if (fileSize <= 0) {
            return {
                valid: false,
                errorMessage: '文件大小无效',
                errors: ['文件大小无效'],
            };
        }
        if (fileSize > maxSize) {
            return {
                valid: false,
                errorMessage: `文件大小超过限制（最大${this.formatFileSize(maxSize)}）`,
                errors: [`文件大小超过限制（最大${this.formatFileSize(maxSize)}）`],
            };
        }
        return { valid: true, errors: [] };
    }
    static validateMagicNumber(fileHeader, fileName) {
        const extension = this.getFileExtension(fileName);
        if (!this.MAGIC_NUMBERS[extension]) {
            return { valid: true, errors: [] };
        }
        const expectedMagic = this.MAGIC_NUMBERS[extension];
        if (!fileHeader || fileHeader.length < expectedMagic.length) {
            return {
                valid: false,
                errorMessage: '文件内容不完整',
                errors: ['文件内容不完整'],
            };
        }
        for (let i = 0; i < expectedMagic.length; i++) {
            if (fileHeader[i] !== expectedMagic[i]) {
                return {
                    valid: false,
                    errorMessage: '文件类型与扩展名不匹配',
                    errors: ['文件类型与扩展名不匹配'],
                };
            }
        }
        return { valid: true, errors: [] };
    }
    static validateContentType(contentType, fileName) {
        if (!contentType || contentType.trim().length === 0) {
            return {
                valid: false,
                errorMessage: '内容类型不能为空',
                errors: ['内容类型不能为空'],
            };
        }
        const extension = this.getFileExtension(fileName);
        const contentTypeMap = {
            pdf: ['application/pdf'],
            jpg: ['image/jpeg', 'image/jpg'],
            jpeg: ['image/jpeg', 'image/jpg'],
            png: ['image/png'],
            gif: ['image/gif'],
            doc: ['application/msword'],
            docx: [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            xls: ['application/vnd.ms-excel'],
            xlsx: [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            zip: ['application/zip', 'application/x-zip-compressed'],
        };
        if (contentTypeMap[extension]) {
            const expectedTypes = contentTypeMap[extension];
            if (!expectedTypes.includes(contentType.toLowerCase())) {
                return {
                    valid: false,
                    errorMessage: '内容类型与文件扩展名不匹配',
                    errors: ['内容类型与文件扩展名不匹配'],
                };
            }
        }
        return { valid: true, errors: [] };
    }
    static getFileExtension(fileName) {
        if (!fileName || !fileName.includes('.')) {
            return '';
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
    static formatFileSize(size) {
        if (size < 1024) {
            return size + ' B';
        }
        else if (size < 1024 * 1024) {
            return (size / 1024).toFixed(2) + ' KB';
        }
        else {
            return (size / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }
}
exports.FileValidator = FileValidator;
//# sourceMappingURL=file-validator.js.map