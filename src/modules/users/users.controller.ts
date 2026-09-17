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
import { CreateUserDto } from './dto/create-users.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi xodim (ADMIN/SUPERADMIN) qoʻshish' })
  @ApiCreatedResponse({ description: 'Xodim yaratildi' })
  @ApiForbiddenResponse({ description: 'Ruxsat yoʻq' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Xodimlar roʻyxati (sahifalash + qidiruv)' })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta xodim maʼlumoti' })
  @ApiOkResponse({ description: 'Xodim maʼlumoti' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Xodim maʼlumotlarini yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xodimni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.remove(id, user);
  }
}
