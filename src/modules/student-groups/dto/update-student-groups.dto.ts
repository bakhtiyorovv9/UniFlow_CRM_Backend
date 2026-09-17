import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';

export class UpdateStudentGroupDto {
  @ApiPropertyOptional({ enum: Status, example: Status.active })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
