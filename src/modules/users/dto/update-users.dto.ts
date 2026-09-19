import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';
import { CreateUserDto } from './create-users.dto.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ enum: Status, example: Status.active })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
