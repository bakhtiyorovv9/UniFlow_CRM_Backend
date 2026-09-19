import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateHomeworkAnswerDto {
  @ApiProperty({ example: 1, description: 'Vazifa id (Homework jadvalidan)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  homework_id: number;

  @ApiProperty({ example: 'Mening javobim' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'https://example.com/my-answer.pdf',
    description: "Fayl URL yoki yo'li",
  })
  @IsOptional()
  @IsString()
  file?: string;
}
