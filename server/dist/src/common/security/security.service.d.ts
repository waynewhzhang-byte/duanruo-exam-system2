export declare class SecurityService {
    encryptAes(plainText: string, key: string): string;
    decryptAes(cipherText: string, key: string): string;
    sha256Hash(input: string): string;
    hashWithSalt(input: string, salt: string): string;
}
