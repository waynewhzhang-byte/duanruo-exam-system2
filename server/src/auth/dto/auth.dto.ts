import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class SelectTenantDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;
}
