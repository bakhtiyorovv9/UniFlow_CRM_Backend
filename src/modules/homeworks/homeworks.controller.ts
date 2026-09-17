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
import { CreateHomeworkDto } from './dto/create-homeworks.dto.js';
import { QueryHomeworksDto } from './dto/query-homeworks.dto.js';
import { UpdateHomeworkDto } from './dto/update-homeworks.dto.js';
import { HomeworksService } from './homeworks.service.js';

@ApiTags('homeworks')
@Controller('homeworks')
export class HomeworksController {
  constructor(private readonly homeworksService: HomeworksService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Yangi vazifa yaratish' })
  @ApiCreatedResponse({ description: 'Vazifa yaratildi' })
  @ApiForbiddenResponse({ description: 'Siz bu guruh oʻqituvchisi emassiz' })
  create(@Body() dto: CreateHomeworkDto, @CurrentUser() user: AuthUser) {
    return this.homeworksService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Vazifalar roʻyxati (ADMIN — hammasi, TEACHER va STUDENT — oʻz guruhlari)',
  })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryHomeworksDto, @CurrentUser() user: AuthUser) {
    return this.homeworksService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta vazifa' })
  @ApiOkResponse({ description: 'Vazifa' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworksService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Vazifani yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHomeworkDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Vazifani oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.homeworksService.remove(id, user);
  }
}
