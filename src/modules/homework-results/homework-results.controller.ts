import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
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
import { CreateHomeworkResultDto } from './dto/create-homework-results.dto.js';
import { HomeworkResultsService } from './homework-results.service.js';

@ApiTags('homework-results')
@Controller('homework-results')
export class HomeworkResultsController {
  constructor(
    private readonly homeworkResultsService: HomeworkResultsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({
    summary: "Javobga baho qo'yish (upsert — takror yuborilsa, yangilanadi)",
  })
  @ApiCreatedResponse({ description: 'Baho saqlandi' })
  @ApiForbiddenResponse({ description: "Siz bu guruh o'qituvchisi emassiz" })
  upsert(@Body() dto: CreateHomeworkResultDto, @CurrentUser() user: AuthUser) {
    return this.homeworkResultsService.upsert(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      "Baholar ro'yxati (STUDENT — o'zinikilari, TEACHER — o'z guruhlari, ADMIN — hammasi)",
  })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@CurrentUser() user: AuthUser) {
    return this.homeworkResultsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta baho' })
  @ApiOkResponse({ description: 'Baho' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkResultsService.findOne(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Bahoni o'chirish" })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.homeworkResultsService.remove(id, user);
  }
}
