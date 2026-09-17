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
import { AttendanceService } from './attendance.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Butun guruh davomatini yozish (bir necha talaba birdaniga)',
  })
  @ApiCreatedResponse({ description: 'Yozildi' })
  @ApiForbiddenResponse({ description: 'Siz bu guruh oʻqituvchisi emassiz' })
  create(@Body() dto: CreateAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary:
      'Davomat roʻyxati (ADMIN — hammasi, TEACHER — oʻz guruhlari, STUDENT — oʻz yozuvlari)',
  })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta davomat yozuvi' })
  @ApiOkResponse({ description: 'Yozuv' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Davomat yozuvini yangilash (isPresent)' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Yozuvni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.attendanceService.remove(id, user);
  }
}
