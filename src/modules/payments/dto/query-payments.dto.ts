import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Talaba bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  student_id?: number;

  @ApiPropertyOptional({ description: "Guruh bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    description: 'Shu vaqtdan boshlab (paid_at >= from)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.999Z',
    description: 'Shu vaqtgacha (paid_at <= to)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
