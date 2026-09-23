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
import { CreateStudentDto } from './dto/create-students.dto.js';
import { QueryStudentsDto } from './dto/query-students.dto.js';
import { UpdateStudentDto } from './dto/update-students.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('students')
@Controller('students')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @ApiOperation({ summary: "Yangi talaba qo'shish" })
  @ApiCreatedResponse({ description: 'Talaba yaratildi' })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Talabalar ro'yxati" })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(query);
  }

  @Get('counts')
  @ApiOperation({
    summary:
      "Holat bo'yicha talabalar soni (filtr chiplari uchun bitta so'rov)",
  })
  @ApiOkResponse({ description: 'Sonlar' })
  counts() {
    return this.studentsService.counts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta talaba' })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Talabani yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/archive')
  @ApiOperation({
    summary: 'Talabani arxivga yuborish (guruhlardan chiqariladi)',
  })
  @ApiOkResponse({ description: 'Arxivga yuborildi' })
  @ApiBadRequestResponse({ description: 'Allaqachon arxivda' })
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.archive(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Talabani arxivdan tiklash' })
  @ApiOkResponse({ description: 'Tiklandi' })
  @ApiBadRequestResponse({ description: 'Arxivda emas' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Talabani butunlay o'chirish (faqat arxivdagilar)",
  })
  @ApiOkResponse({ description: "O'chirildi" })
  @ApiBadRequestResponse({ description: 'Avval arxivga yuborish kerak' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
