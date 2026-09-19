import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { WeekDay } from '../../../common/enums/index.js';

export class CreateGroupDto {
  @ApiProperty({ example: 'Node-01', description: 'Guruh nomi (unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Kechki guruh' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1, description: 'Kurs id (Course jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  course_id: number;

  @ApiProperty({ example: 1, description: 'Xona id (Room jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  room_id: number;

  @ApiProperty({
    example: '2026-10-01',
    description: 'Boshlanish sanasi (ISO)',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '18:00', description: 'Boshlanish vaqti (HH:MM)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "start_time HH:MM formatida bo'lishi kerak",
  })
  start_time: string;

  @ApiProperty({
    example: 20,
    description: 'Maksimal talabalar soni',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max_student: number;

  @ApiProperty({
    example: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    enum: WeekDay,
    isArray: true,
    description: 'Dars kunlari',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(WeekDay, { each: true })
  week_day: WeekDay[];
}
