import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Matches,
  Length,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'Code must contain only lowercase letters, numbers, and underscores',
  })
  @Length(1, 50)
  code: string;

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;
}
