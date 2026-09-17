import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryHomeworksDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Guruh boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  @ApiPropertyOptional({ description: 'Dars boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lesson_id?: number;
}
