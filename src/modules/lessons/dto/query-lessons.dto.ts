import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryLessonsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({ description: 'Guruh boʻyicha filtr' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;
}
