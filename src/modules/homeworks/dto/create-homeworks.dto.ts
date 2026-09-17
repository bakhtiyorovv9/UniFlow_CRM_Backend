import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateHomeworkDto {
  @ApiProperty({ example: 1, description: 'Guruh id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id: number;

  @ApiProperty({ example: 1, description: 'Dars id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lesson_id: number;

  @ApiProperty({ example: 'Middleware yozing' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'https://example.com/homework.pdf',
    description: 'Fayl URL yoki yoʻli',
  })
  @IsOptional()
  @IsString()
  file?: string;
}
