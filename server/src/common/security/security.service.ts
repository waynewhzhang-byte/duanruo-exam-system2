import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class SecurityService {
  /**
   * AES 加密 (CBC 模式)
   * @param plainText 明文
   * @param key Base64 编码的密钥
   * @returns Base64 编码的密文（包含 IV）
   */
  encryptAes(plainText: string, key: string): string {
    if (!plainText) return plainText;

    const keyHex = CryptoJS.enc.Base64.parse(key);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(plainText, keyHex, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // 合并 IV 和密文
    const combined = iv.concat(encrypted.ciphertext);
    return CryptoJS.enc.Base64.stringify(combined);
  }

  /**
   * AES 解密 (CBC 模式)
   * @param cipherText Base64 编码的密文（包含 IV）
   * @param key Base64 编码的密钥
   * @returns 明文
   */
  decryptAes(cipherText: string, key: string): string {
    if (!cipherText) return cipherText;

    const keyHex = CryptoJS.enc.Base64.parse(key);
    const combined = CryptoJS.enc.Base64.parse(cipherText);

    // 分离 IV 和密文
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
    const encryptedText = CryptoJS.lib.WordArray.create(
      combined.words.slice(4),
    );

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedText } as CryptoJS.lib.CipherParams,
      keyHex,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * SHA-256 哈希
   */
  sha256Hash(input: string): string {
    if (!input) return input;
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Base64);
  }

  /**
   * 带盐值的哈希
   */
  hashWithSalt(input: string, salt: string): string {
    return this.sha256Hash(input + salt);
  }
}
