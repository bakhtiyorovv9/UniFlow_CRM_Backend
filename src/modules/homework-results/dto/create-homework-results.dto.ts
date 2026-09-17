import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { HomeworkStatus } from '../../../common/enums/index.js';

export class CreateHomeworkResultDto {
  @ApiProperty({ example: 1, description: 'Javob id (HomeworkAnswerStudent)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  homework_answer_id: number;

  @ApiProperty({
    example: 90,
    description: 'Baho (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  grade: number;

  @ApiProperty({ example: 'Yaxshi ish, lekin xatolar bor' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: HomeworkStatus,
    example: HomeworkStatus.ACCEPTED,
    description: 'Yakuniy status',
  })
  @IsEnum(HomeworkStatus)
  homeworkStatus: HomeworkStatus;
}
