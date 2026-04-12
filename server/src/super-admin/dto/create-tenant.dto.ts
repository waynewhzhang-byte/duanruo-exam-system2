import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ description: '租户名称', example: '演示大学' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '租户唯一标识码', example: 'demo' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'Code must contain only lowercase letters, numbers, underscores, or hyphens',
  })
  @Length(1, 50)
  code: string;

  @ApiProperty({ description: '联系人邮箱', example: 'admin@demo.edu.cn' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiPropertyOptional({ description: '联系人电话', example: '13800138000' })
  @IsString()
  @IsOptional()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: '租户描述',
    example: '这是一个用于演示的租户',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
