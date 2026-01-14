export declare enum PiiType {
    NAME = "NAME",
    PHONE = "PHONE",
    EMAIL = "EMAIL",
    ID_CARD = "ID_CARD",
    BANK_CARD = "BANK_CARD",
    ADDRESS = "ADDRESS",
    CUSTOM = "CUSTOM"
}
export declare class PiiService {
    mask(value: string, type: PiiType): string;
    private maskPhone;
    private maskIdCard;
    private maskEmail;
    private maskName;
    private maskBankCard;
    private maskAddress;
    shouldMask(userRoles: string[], allowedRoles: string[]): boolean;
}
