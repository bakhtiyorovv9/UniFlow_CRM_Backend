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
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
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
  @ApiOperation({ summary: 'Guruhlar roʻyxati' })
  @ApiOkResponse({ description: 'Roʻyxat' })
  findAll(@Query() query: QueryGroupsDto) {
    return this.groupsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Bitta guruh (kurs, xona, oʻqituvchilar, talabalar bilan)',
  })
  @ApiOkResponse({ description: 'Guruh maʼlumoti' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Guruhni yangilash' })
  @ApiOkResponse({ description: 'Yangilandi' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Guruhni oʻchirish' })
  @ApiOkResponse({ description: 'Oʻchirildi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
