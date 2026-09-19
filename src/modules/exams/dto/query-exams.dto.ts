import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryExamsDto {
  @ApiPropertyOptional({ description: "Guruh bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id?: number;
}
