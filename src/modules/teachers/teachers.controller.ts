import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import { CreateTeacherDto } from './dto/create-teachers.dto.js';
import { QueryTeachersDto } from './dto/query-teachers.dto.js';
import { UpdateTeacherDto } from './dto/update-teachers.dto.js';
import { TeachersService } from './teachers.service.js';

@ApiTags('teachers')
@Controller('teachers')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @ApiOperation({ summary: "Yangi o'qituvchi qo'shish" })
  @ApiCreatedResponse({ description: "O'qituvchi yaratildi" })
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "O'qituvchilar ro'yxati" })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: QueryTeachersDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Bitta o'qituvchi" })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "O'qituvchini yangilash" })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({
    summary: "O'qituvchini arxivga yuborish (guruhlardan chiqariladi)",
  })
  @ApiOkResponse({ description: 'Arxivga yuborildi' })
  @ApiBadRequestResponse({ description: 'Allaqachon arxivda' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.archive(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: "O'qituvchini arxivdan tiklash" })
  @ApiOkResponse({ description: 'Tiklandi' })
  @ApiBadRequestResponse({ description: 'Arxivda emas' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "O'qituvchini butunlay o'chirish (faqat arxivdagilar)",
  })
  @ApiOkResponse({ description: "O'chirildi" })
  @ApiBadRequestResponse({ description: 'Avval arxivga yuborish kerak' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }
}
