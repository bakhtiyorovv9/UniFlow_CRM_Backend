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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import { CreateStudentGroupDto } from './dto/create-student-groups.dto.js';
import { QueryStudentGroupsDto } from './dto/query-student-groups.dto.js';
import { UpdateStudentGroupDto } from './dto/update-student-groups.dto.js';
import { StudentGroupsService } from './student-groups.service.js';

@ApiTags('student-groups')
@Controller('student-groups')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class StudentGroupsController {
  constructor(private readonly studentGroupsService: StudentGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Talabani guruhga biriktirish' })
  @ApiCreatedResponse({ description: 'Biriktirildi' })
  @ApiBadRequestResponse({ description: 'Guruh toʻlgan' })
  @ApiConflictResponse({ description: 'Talaba allaqachon shu guruhda' })
  create(@Body() dto: CreateStudentGroupDto) {
    return this.studentGroupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Biriktirishlar roʻyxati' })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryStudentGroupsDto) {
    return this.studentGroupsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta biriktirish' })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentGroupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Statusni oʻzgartirish (active/inactive/freeze)' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentGroupDto,
  ) {
    return this.studentGroupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Biriktirishni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentGroupsService.remove(id);
  }
}
