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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import { CreateGroupTeacherDto } from './dto/create-group-teachers.dto.js';
import { QueryGroupTeachersDto } from './dto/query-group-teachers.dto.js';
import { UpdateGroupTeacherDto } from './dto/update-group-teachers.dto.js';
import { GroupTeachersService } from './group-teachers.service.js';

@ApiTags('group-teachers')
@Controller('group-teachers')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class GroupTeachersController {
  constructor(private readonly groupTeachersService: GroupTeachersService) {}

  @Post()
  @ApiOperation({ summary: "O'qituvchini guruhga biriktirish" })
  @ApiCreatedResponse({ description: 'Biriktirildi' })
  @ApiConflictResponse({ description: "Bu o'qituvchi allaqachon shu guruhda" })
  create(@Body() dto: CreateGroupTeacherDto) {
    return this.groupTeachersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Biriktirishlar ro'yxati" })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: QueryGroupTeachersDto) {
    return this.groupTeachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta biriktirish' })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupTeachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Status o'zgartirish (active/inactive/planned/completed)",
  })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupTeacherDto,
  ) {
    return this.groupTeachersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Biriktirishni o'chirish" })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupTeachersService.remove(id);
  }
}
