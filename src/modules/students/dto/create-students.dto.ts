import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Karimov Doston' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'doston@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+998923336699' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '2005-04-12', description: "Tug'ilgan sana (ISO)" })
  @IsDateString()
  birth_date: string;

  @ApiProperty({ example: 'Toshkent, Chilonzor' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  photo?: string;
}