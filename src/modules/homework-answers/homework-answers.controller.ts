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
import { CreateHomeworkAnswerDto } from './dto/create-homework-answers.dto.js';
import { QueryHomeworkAnswersDto } from './dto/query-homework-answers.dto.js';
import { UpdateHomeworkAnswerDto } from './dto/update-homework-answers.dto.js';
import { HomeworkAnswersService } from './homework-answers.service.js';

@ApiTags('homework-answers')
@Controller('homework-answers')
export class HomeworkAnswersController {
  constructor(
    private readonly homeworkAnswersService: HomeworkAnswersService,
  ) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Talaba vazifaga javob yuboradi' })
  @ApiCreatedResponse({ description: 'Javob yuborildi' })
  @ApiForbiddenResponse({ description: 'Siz bu guruh talabasi emassiz' })
  create(@Body() dto: CreateHomeworkAnswerDto, @CurrentUser() user: AuthUser) {
    return this.homeworkAnswersService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Javoblar roʻyxati (STUDENT — oʻzinikilari, TEACHER — oʻz guruhlari, ADMIN — hammasi)',
  })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(
    @Query() query: QueryHomeworkAnswersDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkAnswersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta javob' })
  @ApiOkResponse({ description: 'Javob' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkAnswersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Javob statusini oʻzgartirish (ACCEPTED/REJECTED/CHECKED)',
  })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHomeworkAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.homeworkAnswersService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Javobni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.homeworkAnswersService.remove(id, user);
  }
}
