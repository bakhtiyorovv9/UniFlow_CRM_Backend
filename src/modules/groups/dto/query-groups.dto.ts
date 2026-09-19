import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { GroupStatus } from '../../../common/enums/index.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryGroupsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;

  @ApiPropertyOptional({ description: "Kurs bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  course_id?: number;

  @ApiPropertyOptional({ description: "Xona bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  room_id?: number;
}
