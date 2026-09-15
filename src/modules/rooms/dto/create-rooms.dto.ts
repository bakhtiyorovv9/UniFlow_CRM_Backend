import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '4-xona | bin-xonasi', description: 'Xona nomi (unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 20, description: 'Sigʻimi (kishi)', minimum: 1 })
  @IsInt()
  @Min(1)
  capacity: number;
}