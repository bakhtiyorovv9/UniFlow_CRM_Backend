import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Node.js Backend', description: 'Kurs nomi (unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'REST API va bazalar bilan ishlash' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1500000, description: "Narxi so'mda" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 96, description: 'Umumiy soatlar', minimum: 1 })
  @IsInt()
  @Min(1)
  duration_hours: number;

  @ApiProperty({ example: 6, description: "Oylar soni", minimum: 1 })
  @IsInt()
  @Min(1)
  duration_month: number;
}