import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateGroupTeacherDto } from './dto/create-group-teachers.dto.js';
import { QueryGroupTeachersDto } from './dto/query-group-teachers.dto.js';
import { UpdateGroupTeacherDto } from './dto/update-group-teachers.dto.js';

@Injectable()
export class GroupTeachersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateGroupTeacherDto) {
    return this.prisma.groupTeacher.create({
      data: dto,
      include: {
        Teacher: { omit: { password: true } },
        Group: {
          include: {
            courses: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findAll(query: QueryGroupTeachersDto) {
    const { page = 1, limit = 10, status, group_id, teacher_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupTeacherWhereInput = {
      ...(status && { status }),
      ...(group_id && { group_id }),
      ...(teacher_id && { teacher_id }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.groupTeacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Teacher: { omit: { password: true } },
          Group: {
            include: {
              courses: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.groupTeacher.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const link = await this.prisma.groupTeacher.findUnique({
      where: { id },
      include: {
        Teacher: { omit: { password: true } },
        Group: true,
      },
    });
    if (!link) throw new NotFoundException('Biriktirish topilmadi');
    return link;
  }

  update(id: number, dto: UpdateGroupTeacherDto) {
    return this.prisma.groupTeacher.update({
      where: { id },
      data: dto,
      include: {
        Teacher: { omit: { password: true } },
        Group: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.groupTeacher.delete({ where: { id } });
  }
}
