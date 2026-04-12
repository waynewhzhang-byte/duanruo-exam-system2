import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export enum PiiType {
  NAME = 'NAME',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ID_CARD = 'ID_CARD',
  BANK_CARD = 'BANK_CARD',
  ADDRESS = 'ADDRESS',
  CUSTOM = 'CUSTOM',
}

@Injectable()
export class PiiService {
  private readonly logger = new Logger(PiiService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.get<string>('APP_SECRET') ||
      'default-encryption-key-change-in-production';
  }

  encrypt(value: string): string {
    if (!value) return value;

    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Encryption failed: ${errorMessage}`);
      return value;
    }
  }

  decrypt(value: string): string {
    if (!value || !value.includes(':')) return value;

    try {
      const parts = value.split(':');
      if (parts.length !== 3) return value;

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Decryption failed: ${errorMessage}`);
      return value;
    }
  }

  mask(value: string, type: PiiType): string {
    if (!value) return value;

    switch (type) {
      case PiiType.NAME:
        return this.maskName(value);
      case PiiType.PHONE:
        return this.maskPhone(value);
      case PiiType.EMAIL:
        return this.maskEmail(value);
      case PiiType.ID_CARD:
        return this.maskIdCard(value);
      case PiiType.BANK_CARD:
        return this.maskBankCard(value);
      case PiiType.ADDRESS:
        return this.maskAddress(value);
      default:
        return '****';
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length < 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  private maskIdCard(idCard: string): string {
    if (idCard.length < 10) return idCard;
    return (
      idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
    );
  }

  private maskEmail(email: string): string {
    if (!email.includes('@')) return email;
    const [prefix, domain] = email.split('@');
    if (prefix.length <= 2) return email;
    return prefix.substring(0, 2) + '***@' + domain;
  }

  private maskName(name: string): string {
    if (name.length <= 1) return name;
    return name.charAt(0) + '*'.repeat(name.length - 1);
  }

  private maskBankCard(bankCard: string): string {
    if (bankCard.length < 8) return bankCard;
    return (
      bankCard.substring(0, 4) +
      '********' +
      bankCard.substring(bankCard.length - 4)
    );
  }

  private maskAddress(address: string): string {
    if (address.length < 6) return address;
    return address.substring(0, 6) + '****';
  }

  shouldMask(userRoles: string[], allowedRoles: string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return true;
    return !userRoles.some((role) => allowedRoles.includes(role));
  }
}
