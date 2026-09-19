import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ExamResultItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiProperty({ example: true, description: 'Imtihonga keldimi' })
  @IsBoolean()
  attended: boolean;

  @ApiPropertyOptional({
    example: 85,
    description: "Ball (kelmagan bo'lsa bo'sh)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score?: number | null;

  @ApiPropertyOptional({ example: 'Yaxshi natija' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class SaveExamResultsDto {
  @ApiProperty({ type: [ExamResultItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamResultItemDto)
  results: ExamResultItemDto[];
}
