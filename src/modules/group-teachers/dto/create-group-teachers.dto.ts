import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateGroupTeacherDto {
  @ApiProperty({ example: 1, description: 'Guruh id (Group jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;

  @ApiProperty({
    example: 1,
    description: 'Oʻqituvchi id (Teacher jadvalidan)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teacher_id: number;
}
