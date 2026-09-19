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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { CreateGroupDto } from './dto/create-groups.dto.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { UpdateGroupDto } from './dto/update-groups.dto.js';
import { GroupsService } from './groups.service.js';

@ApiTags('groups')
@Controller('groups')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Yangi guruh yaratish' })
  @ApiCreatedResponse({ description: 'Guruh yaratildi' })
  @ApiBadRequestResponse({ description: 'Xonada shu vaqtda boshqa guruh bor' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER, Role.STUDENT)
  @ApiOperation({
    summary:
      "Guruhlar ro'yxati (TEACHER — biriktirilgan guruhlar, STUDENT — o'qiyotgan guruhlari)",
  })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: QueryGroupsDto, @CurrentUser() user: AuthUser) {
    return this.groupsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Bitta guruh (kurs, xona, o'qituvchilar, talabalar bilan)",
  })
  @ApiOkResponse({ description: 'Guruh maʼlumoti' })
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER, Role.STUDENT)
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  @ApiForbiddenResponse({ description: "Siz bu guruh o'qituvchisi emassiz" })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groupsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Guruhni yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({
    summary:
      "Guruhni butunlay o'chirish (faqat SUPERADMIN): darslar, davomat, vazifalar, imtihonlar va videolar ham o'chadi",
  })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
