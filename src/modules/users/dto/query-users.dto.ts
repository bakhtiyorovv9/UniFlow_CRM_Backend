import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role, Status } from '../../../common/enums/index.js';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
