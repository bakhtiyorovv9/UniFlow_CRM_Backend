import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateLessonVideoDto {
  @ApiProperty({ example: 1, description: 'Dars id (Lesson jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lesson_id: number;
}
