import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class AttendanceRecordDto {
  @ApiProperty({ example: 1, description: 'Talaba id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  student_id: number;

  @ApiProperty({ example: true, description: 'Keldi (true) | Kelmadi (false)' })
  @IsBoolean()
  isPresent: boolean;
}

export class CreateAttendanceDto {
  @ApiProperty({ example: 1, description: 'Guruh id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;

  @ApiProperty({
    type: [AttendanceRecordDto],
    description: 'Har talaba uchun keldi/kelmadi',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
