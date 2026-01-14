import { Injectable } from '@nestjs/common';

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
  /**
   * 脱敏 PII 数据
   */
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

  /**
   * 判断是否需要脱敏
   */
  shouldMask(userRoles: string[], allowedRoles: string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRoles || userRoles.length === 0) return true;
    return !userRoles.some((role) => allowedRoles.includes(role));
  }
}
