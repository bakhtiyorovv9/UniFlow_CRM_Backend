import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional } from 'class-validator';

export class SummaryAttendanceDto {
  @ApiPropertyOptional({
    enum: ['group', 'student'],
    default: 'group',
    description: 'Qaysi kesimda jamlansin',
  })
  @IsOptional()
  @IsIn(['group', 'student'])
  by?: 'group' | 'student';

  @ApiPropertyOptional({ description: 'Boshlanish sanasi (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Tugash sanasi (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: "Guruh bo'yicha filtr" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;
}
