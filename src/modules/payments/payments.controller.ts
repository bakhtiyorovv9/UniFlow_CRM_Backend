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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { CreatePaymentDto } from './dto/create-payments.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { UpdatePaymentDto } from './dto/update-payments.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@Controller('payments')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: "Talabadan qabul qilingan to'lovni kiritish" })
  @ApiCreatedResponse({ description: "To'lov saqlandi" })
  @ApiBadRequestResponse({ description: 'Talaba yoki guruh topilmadi' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: "To'lovlar ro'yxati (sahifalash, sana oralig'i, jami summa)",
  })
  @ApiOkResponse({ description: "Ro'yxat va filtrlangan to'lovlar jami (sum)" })
  findAll(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Bitta to'lov" })
  @ApiOkResponse({ description: 'Maʼlumot' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "To'lovni tahrirlash" })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: "To'lovni o'chirish" })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
