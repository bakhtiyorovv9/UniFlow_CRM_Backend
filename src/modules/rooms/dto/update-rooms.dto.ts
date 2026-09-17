import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '../../../common/enums/index.js';
import { CreateRoomDto } from './create-rooms.dto.js';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @ApiPropertyOptional({ enum: Status, example: Status.active })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
