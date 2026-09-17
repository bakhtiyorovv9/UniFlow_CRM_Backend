import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { HomeworkStatus } from '../../../common/enums/index.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryHomeworkAnswersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: HomeworkStatus })
  @IsOptional()
  @IsEnum(HomeworkStatus)
  homeworkStatus?: HomeworkStatus;

  @ApiPropertyOptional({ description: 'Vazifa boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  homework_id?: number;

  @ApiPropertyOptional({ description: 'Talaba boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  student_id?: number;
}
