import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ example: 1, description: 'Guruh id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;

  @ApiProperty({ example: '1-oylik imtihon' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'JavaScript asoslari, DOM' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2026-10-01T10:00:00.000Z',
    description: 'Imtihon sanasi va vaqti',
  })
  @IsDateString()
  exam_date: string;

  @ApiProperty({
    example: '2026-10-01T12:00:00.000Z',
    description: 'Imtihon tugash sanasi va vaqti',
  })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  max_score?: number;

  @ApiPropertyOptional({ example: 60, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  pass_score?: number;
}
