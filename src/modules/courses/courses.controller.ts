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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto } from './dto/create-courses.dto.js';
import { QueryCoursesDto } from './dto/query-courses.dto.js';
import { UpdateCourseDto } from './dto/update-courses.dto.js';

@ApiTags('courses')
@Controller('courses')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi kurs qoʻshish' })
  @ApiCreatedResponse({ description: 'Kurs yaratildi' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Kurslar roʻyxati' })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryCoursesDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta kurs maʼlumoti' })
  @ApiOkResponse({ description: 'Kurs' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Kursni yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kursni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.remove(id);
  }
}
