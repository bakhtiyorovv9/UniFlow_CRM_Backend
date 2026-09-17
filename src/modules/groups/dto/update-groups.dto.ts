import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { GroupStatus } from '../../../common/enums/index.js';
import { CreateGroupDto } from './create-groups.dto.js';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @ApiPropertyOptional({ enum: GroupStatus, example: GroupStatus.active })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
