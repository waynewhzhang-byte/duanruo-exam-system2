"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiiService = exports.PiiType = void 0;
const common_1 = require("@nestjs/common");
var PiiType;
(function (PiiType) {
    PiiType["NAME"] = "NAME";
    PiiType["PHONE"] = "PHONE";
    PiiType["EMAIL"] = "EMAIL";
    PiiType["ID_CARD"] = "ID_CARD";
    PiiType["BANK_CARD"] = "BANK_CARD";
    PiiType["ADDRESS"] = "ADDRESS";
    PiiType["CUSTOM"] = "CUSTOM";
})(PiiType || (exports.PiiType = PiiType = {}));
let PiiService = class PiiService {
    mask(value, type) {
        if (!value)
            return value;
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
    maskPhone(phone) {
        if (phone.length < 7)
            return phone;
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
    }
    maskIdCard(idCard) {
        if (idCard.length < 10)
            return idCard;
        return (idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4));
    }
    maskEmail(email) {
        if (!email.includes('@'))
            return email;
        const [prefix, domain] = email.split('@');
        if (prefix.length <= 2)
            return email;
        return prefix.substring(0, 2) + '***@' + domain;
    }
    maskName(name) {
        if (name.length <= 1)
            return name;
        return name.charAt(0) + '*'.repeat(name.length - 1);
    }
    maskBankCard(bankCard) {
        if (bankCard.length < 8)
            return bankCard;
        return (bankCard.substring(0, 4) +
            '********' +
            bankCard.substring(bankCard.length - 4));
    }
    maskAddress(address) {
        if (address.length < 6)
            return address;
        return address.substring(0, 6) + '****';
    }
    shouldMask(userRoles, allowedRoles) {
        if (!allowedRoles || allowedRoles.length === 0)
            return true;
        if (!userRoles || userRoles.length === 0)
            return true;
        return !userRoles.some((role) => allowedRoles.includes(role));
    }
};
exports.PiiService = PiiService;
exports.PiiService = PiiService = __decorate([
    (0, common_1.Injectable)()
], PiiService);
//# sourceMappingURL=pii.service.js.map