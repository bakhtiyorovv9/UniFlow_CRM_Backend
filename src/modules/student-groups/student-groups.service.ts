import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateStudentGroupDto } from './dto/create-student-groups.dto.js';
import { QueryStudentGroupsDto } from './dto/query-student-groups.dto.js';
import { UpdateStudentGroupDto } from './dto/update-student-groups.dto.js';

@Injectable()
export class StudentGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: dto.group_id },
      include: {
        _count: {
          select: {
            studentGroups: { where: { status: 'active' } },
          },
        },
      },
    });

    if (!group) throw new NotFoundException('Guruh topilmadi');

    if (group._count.studentGroups >= group.max_student) {
      throw new BadRequestException(
        `Guruh toʻlgan: ${group._count.studentGroups}/${group.max_student}`,
      );
    }

    return this.prisma.studentGroup.create({
      data: dto,
      include: {
        students: { omit: { password: true } },
        groups: {
          include: {
            courses: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async findAll(query: QueryStudentGroupsDto) {
    const { page = 1, limit = 10, status, group_id, student_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentGroupWhereInput = {
      ...(status && { status }),
      ...(group_id && { group_id }),
      ...(student_id && { student_id }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.studentGroup.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          students: { omit: { password: true } },
          groups: {
            include: {
              courses: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.studentGroup.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const link = await this.prisma.studentGroup.findUnique({
      where: { id },
      include: {
        students: { omit: { password: true } },
        groups: true,
      },
    });
    if (!link) throw new NotFoundException('Biriktirish topilmadi');
    return link;
  }

  update(id: number, dto: UpdateStudentGroupDto) {
    return this.prisma.studentGroup.update({
      where: { id },
      data: dto,
      include: {
        students: { omit: { password: true } },
        groups: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.studentGroup.delete({ where: { id } });
  }
}
