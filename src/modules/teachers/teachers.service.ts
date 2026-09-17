import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateTeacherDto } from './dto/create-teachers.dto.js';
import { QueryTeachersDto } from './dto/query-teachers.dto.js';
import { UpdateTeacherDto } from './dto/update-teachers.dto.js';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
      },
      omit: { password: true },
    });
  }

  async findAll(query: QueryTeachersDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TeacherWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        omit: { password: true },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");
    return teacher;
  }

  async update(id: number, dto: UpdateTeacherDto) {
    const data: Prisma.TeacherUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.teacher.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  remove(id: number) {
    return this.prisma.teacher.delete({
      where: { id },
      omit: { password: true },
    });
  }
}
