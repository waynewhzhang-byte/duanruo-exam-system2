export interface ValidationResult {
    valid: boolean;
    errorMessage?: string;
    errors: string[];
}
export declare class FileValidator {
    private static readonly ALLOWED_EXTENSIONS;
    private static readonly DANGEROUS_EXTENSIONS;
    private static readonly SAFE_FILENAME_PATTERN;
    private static readonly MAX_FILENAME_LENGTH;
    private static readonly DEFAULT_MAX_FILE_SIZE;
    private static readonly MAGIC_NUMBERS;
    static validateFileName(fileName: string): ValidationResult;
    static validateFileExtension(fileName: string, allowedExtensions?: string[]): ValidationResult;
    static validateFileSize(fileSize: number, maxSize?: number): ValidationResult;
    static validateMagicNumber(fileHeader: Buffer, fileName: string): ValidationResult;
    static validateContentType(contentType: string, fileName: string): ValidationResult;
    private static getFileExtension;
    private static formatFileSize;
}
