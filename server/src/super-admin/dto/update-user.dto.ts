import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  Length,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: '用户名', example: 'admin001' })
  @IsString()
  @IsOptional()
  @Length(3, 50)
  username?: string;

  @ApiPropertyOptional({ description: '密码', example: 'password123' })
  @IsString()
  @IsOptional()
  @Length(6, 100)
  password?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '真实姓名', example: '张三' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: '用户状态', example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: '全局角色列表',
    example: ['TENANT_ADMIN'],
  })
  @IsArray()
  @IsOptional()
  globalRoles?: string[];

  @ApiPropertyOptional({ description: '关联租户ID', example: 'uuid-of-tenant' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({
    description: '在租户中的角色',
    example: 'TENANT_ADMIN',
  })
  @IsString()
  @IsOptional()
  tenantRole?: string;
}
