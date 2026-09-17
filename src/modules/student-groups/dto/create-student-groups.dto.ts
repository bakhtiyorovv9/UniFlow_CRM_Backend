import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateStudentGroupDto {
  @ApiProperty({ example: 1, description: 'Talaba id (Student jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiProperty({ example: 1, description: 'Guruh id (Group jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;
}
