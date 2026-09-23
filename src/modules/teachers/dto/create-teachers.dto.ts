import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

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

  @ApiProperty({ example: 'Xiva shahri' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Login va parolni emailga yuborish',
  })
  @IsOptional()
  @IsBoolean()
  send_email?: boolean;
}
