import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateStudentDto } from './dto/create-students.dto.js';
import { QueryStudentsDto } from './dto/query-students.dto.js';
import { UpdateStudentDto } from './dto/update-students.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        ...dto,
        birth_date: new Date(dto.birth_date),
        password: await bcrypt.hash(dto.password, 10),
      },
      omit: { password: true },
    });
  }

  async findAll(query: QueryStudentsDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
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
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        omit: { password: true },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!student) throw new NotFoundException('Talaba topilmadi');
    return student;
  }

  async update(id: number, dto: UpdateStudentDto) {
    const data: Prisma.StudentUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.birth_date) {
      data.birth_date = new Date(dto.birth_date);
    }

    return this.prisma.student.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  remove(id: number) {
    return this.prisma.student.delete({
      where: { id },
      omit: { password: true },
    });
  }
}