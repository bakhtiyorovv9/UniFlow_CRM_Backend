import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitExamAnswerDto {
  @ApiPropertyOptional({ example: '<p>Mening javobim</p>' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  answer_text?: string;

  @ApiPropertyOptional({ example: '/uploads/files/123.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  answer_file?: string;
}
