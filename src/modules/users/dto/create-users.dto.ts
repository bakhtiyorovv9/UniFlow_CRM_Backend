import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../../common/enums/index.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Valiyev' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: 'ali@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+998901234567' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s()-]/g, '') : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{9,15}$/, {
    message:
      "Telefon raqam + bilan boshlanib, 9-15 ta raqamdan iborat bo'lishi kerak (masalan: +998901234567)",
  })
  phone: string;

  @ApiProperty({ example: 'Toshkent shahri' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    enum: [Role.ADMIN, Role.SUPERADMIN],
    example: Role.ADMIN,
    description: 'Role: [ SUPERADMIN | ADMIN | TEACHER | STUDENT ]',
  })
  @IsIn([Role.ADMIN, Role.SUPERADMIN])
  role: Role;

  @ApiProperty({ required: false, example: null })
  @IsOptional()
  @IsString()
  photo?: string;
}
