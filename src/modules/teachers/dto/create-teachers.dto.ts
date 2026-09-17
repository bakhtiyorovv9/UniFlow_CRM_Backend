import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ example: 'Aliyev Vali' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'valiteacher@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+998911111111' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Xiva shahri' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  photo?: string;
}
