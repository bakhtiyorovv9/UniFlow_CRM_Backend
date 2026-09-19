import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email yoki telefon raqam',
    example: '+998901234567',
  })
  @ValidateIf((dto: LoginDto) => !dto.email)
  @IsString()
  @IsNotEmpty({ message: 'Email yoki telefon raqamini kiriting' })
  login?: string;

  @ApiPropertyOptional({
    description: "Eski mijozlar uchun: login o'rniga email",
    example: 'example@gmail.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Parol',
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
