import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

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

export class RegisterRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  password!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  fullName!: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
