import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HomeworkStatus } from '../../../common/enums/index.js';

export class UpdateHomeworkAnswerDto {
  @ApiProperty({
    enum: HomeworkStatus,
    example: HomeworkStatus.ACCEPTED,
    description: 'Faqat oʻqituvchi | admin oʻzgartiradi',
  })
  @IsEnum(HomeworkStatus)
  homeworkStatus: HomeworkStatus;
}
