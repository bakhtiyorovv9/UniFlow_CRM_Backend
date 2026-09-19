import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'Talaba id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Qaysi guruh uchun to'landi (ixtiyoriy)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id?: number;

  @ApiProperty({ example: 1200000, description: "To'langan summa (so'm)" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    example: '2026-09-17T10:30:00.000Z',
    description: "To'lov vaqti (ISO). Berilmasa, hozirgi vaqt",
  })
  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @ApiPropertyOptional({ example: 'Sentabr oyi uchun' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
