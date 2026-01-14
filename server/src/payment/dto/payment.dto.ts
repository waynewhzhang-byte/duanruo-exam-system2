import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';

export enum PaymentChannel {
  ALIPAY = 'ALIPAY',
  WECHAT = 'WECHAT',
  MOCK = 'MOCK',
}

export class InitiatePaymentRequest {
  @IsUUID()
  applicationId: string;

  @IsEnum(PaymentChannel)
  channel: PaymentChannel;
}

export class PaymentCallbackRequest {
  @IsString()
  outTradeNo: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
