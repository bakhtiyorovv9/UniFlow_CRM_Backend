import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateGroupDto } from './dto/create-groups.dto.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { UpdateGroupDto } from './dto/update-groups.dto.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    // Xonada shu vaqtda boshqa guruh yoʻqmi tekshirish
    await this.ensureNoConflict(dto.room_id, dto.start_time, dto.week_day);

    return this.prisma.group.create({
      data: {
        ...dto,
        start_date: new Date(dto.start_date),
      },
      include: {
        courses: true,
        rooms: true,
      },
    });
  }

  async findAll(query: QueryGroupsDto) {
    const { page = 1, limit = 10, search, status, course_id, room_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {
      ...(status && { status }),
      ...(course_id && { course_id }),
      ...(room_id && { room_id }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          courses: { select: { id: true, name: true } },
          rooms: { select: { id: true, name: true } },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        courses: true,
        rooms: true,
        GroupTeacher: {
          include: {
            Teacher: {
              omit: { password: true },
            },
          },
        },
        studentGroups: {
          include: {
            students: {
              omit: { password: true },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    return group;
  }

  async update(id: number, dto: UpdateGroupDto) {
    // Agar vaqt/xona/kun oʻzgarsa, konfliktni qayta tekshiramiz
    if (dto.room_id || dto.start_time || dto.week_day) {
      const current = await this.findOne(id);
      await this.ensureNoConflict(
        dto.room_id ?? current.room_id,
        dto.start_time ?? current.start_time,
        dto.week_day ?? (current.week_day as any),
        id,
      );
    }

    const data: Prisma.GroupUpdateInput = { ...dto };
    if (dto.start_date) {
      data.start_date = new Date(dto.start_date);
    }

    return this.prisma.group.update({
      where: { id },
      data,
      include: {
        courses: true,
        rooms: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.group.delete({ where: { id } });
  }

  private async ensureNoConflict(
    room_id: number,
    start_time: string,
    week_day: string[],
    excludeGroupId?: number,
  ) {
    const conflict = await this.prisma.group.findFirst({
      where: {
        room_id,
        start_time,
        status: { in: ['active', 'planned'] },
        ...(excludeGroupId && { id: { not: excludeGroupId } }),
        week_day: { hasSome: week_day },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        `Bu xonada shu vaqtda boshqa guruh bor: "${conflict.name}"`,
      );
    }
  }
}
