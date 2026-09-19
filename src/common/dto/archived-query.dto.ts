import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from './pagination.dto.js';

export class ArchivedQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      "true bo'lsa faqat arxivdagilar, aks holda faqat arxivda bo'lmaganlar",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archived?: boolean = false;
}
