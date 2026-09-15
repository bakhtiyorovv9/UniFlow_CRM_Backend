import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
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

  @ApiProperty({ example: '+998900000000' })
  @IsString()
  @IsNotEmpty()
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
  @IsIn([Role.ADMIN, Role.SUPERADMIN,Role.STUDENT,Role.TEACHER])
  role: Role;

  @ApiProperty({ required: false, example: null })
  @IsOptional()
  @IsString()
  photo?: string;
}