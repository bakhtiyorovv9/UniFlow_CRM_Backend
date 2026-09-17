import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: 'Guruh id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;

  @ApiProperty({ example: 'Express.js — middleware' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiPropertyOptional({ example: 'CORS, body-parser, error handling' })
  @IsOptional()
  @IsString()
  description?: string;
}
