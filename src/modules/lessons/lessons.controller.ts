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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { CreateLessonDto } from './dto/create-lessons.dto.js';
import { QueryLessonsDto } from './dto/query-lessons.dto.js';
import { UpdateLessonDto } from './dto/update-lessons.dto.js';
import { LessonsService } from './lessons.service.js';

@ApiTags('lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Yangi dars yaratish' })
  @ApiCreatedResponse({ description: 'Dars yaratildi' })
  @ApiForbiddenResponse({ description: 'Siz bu guruh oʻqituvchisi emassiz' })
  create(@Body() dto: CreateLessonDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Darslar roʻyxati (ADMIN — hammasi, TEACHER va STUDENT — faqat oʻz guruhlari)',
  })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryLessonsDto, @CurrentUser() user: AuthUser) {
    return this.lessonsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta dars' })
  @ApiOkResponse({ description: 'Dars' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  @ApiForbiddenResponse({ description: 'Bu darsga kirish huquqingiz yoʻq' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Darsni yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  @ApiForbiddenResponse({ description: 'Siz bu guruh oʻqituvchisi emassiz' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Darsni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.lessonsService.remove(id, user);
  }
}
