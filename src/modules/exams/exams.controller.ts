import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
import { CreateExamDto } from './dto/create-exam.dto.js';
import { QueryExamsDto } from './dto/query-exams.dto.js';
import { SaveExamResultsDto } from './dto/save-exam-results.dto.js';
import { SubmitExamAnswerDto } from './dto/submit-exam-answer.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';
import { ExamsService } from './exams.service.js';

@ApiTags('exams')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Imtihon qo'shish" })
  @ApiCreatedResponse({ description: 'Imtihon yaratildi' })
  @ApiForbiddenResponse({ description: "Siz bu guruh o'qituvchisi emassiz" })
  create(@Body() dto: CreateExamDto, @CurrentUser() user: AuthUser) {
    return this.examsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      "Imtihonlar ro'yxati (ADMIN — hammasi, TEACHER — o'z guruhlari, STUDENT — o'z guruhlari va o'z natijasi)",
  })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: QueryExamsDto, @CurrentUser() user: AuthUser) {
    return this.examsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta imtihon va natijalar' })
  @ApiOkResponse({ description: 'Imtihon' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Imtihonni tahrirlash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examsService.update(id, dto, user);
  }

  @Put(':id/results')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Imtihon davomati va baholarini saqlash (upsert)',
  })
  @ApiOkResponse({ description: 'Saqlandi' })
  saveResults(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveExamResultsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examsService.saveResults(id, dto, user);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({
    summary: 'Talaba imtihon javobini yuboradi (matn va/yoki fayl)',
  })
  @ApiCreatedResponse({ description: 'Javob yuborildi' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitExamAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.examsService.submitAnswer(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({
    summary:
      "Imtihonni o'chirish (TEACHER faqat natijasi yo'q imtihonni o'chira oladi)",
  })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.examsService.remove(id, user);
  }
}
