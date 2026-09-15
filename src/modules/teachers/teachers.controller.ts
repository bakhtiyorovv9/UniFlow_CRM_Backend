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
  @ApiOperation({ summary: 'Yangi oʻqituvchi qoʻshish' })
  @ApiCreatedResponse({ description: 'Oʻqituvchi yaratildi' })
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Oʻqituvchilar roʻyxati' })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryTeachersDto) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta oʻqituvchi' })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Oʻqituvchini yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Oʻqituvchini oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }
}