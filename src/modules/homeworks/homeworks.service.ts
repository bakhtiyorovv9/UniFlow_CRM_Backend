import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { ensureTeacherInGroup } from '../../common/utils/ensure-teacher-in-group.js';
import { ensureGroupOpen } from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateHomeworkDto } from './dto/create-homeworks.dto.js';
import { QueryHomeworksDto } from './dto/query-homeworks.dto.js';
import { UpdateHomeworkDto } from './dto/update-homeworks.dto.js';

@Injectable()
export class HomeworksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHomeworkDto, currentUser: AuthUser) {
    const authorData = await this.resolveAuthor(currentUser, dto.group_id);
    await ensureGroupOpen(this.prisma, dto.group_id);
    if (dto.lesson_id) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lesson_id },
        select: { group_id: true },
      });
      if (!lesson || lesson.group_id !== dto.group_id) {
        throw new BadRequestException(
          'Tanlangan dars bu guruhga tegishli emas',
        );
      }
    }

    return this.prisma.homework.create({
      data: {
        ...dto,
        ...authorData,
      },
      include: {
        groups: { select: { id: true, name: true } },
        lesson: { select: { id: true, topic: true } },
        teachers: { select: { id: true, full_name: true } },
      },
    });
  }

  async findAll(query: QueryHomeworksDto, currentUser: AuthUser) {
    const { page = 1, limit = 10, search, group_id, lesson_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HomeworkWhereInput = {
      ...(group_id && { group_id }),
      ...(lesson_id && { lesson_id }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' },
      }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.homework.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          groups: { select: { id: true, name: true } },
          lesson: { select: { id: true, topic: true } },
        },
      }),
      this.prisma.homework.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        groups: true,
        lesson: true,
        teachers: { omit: { password: true } },
        users: { omit: { password: true } },
      },
    });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    await this.ensureCanView(currentUser, homework.group_id);
    return homework;
  }

  async update(id: number, dto: UpdateHomeworkDto, currentUser: AuthUser) {
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    if (currentUser.role === Role.TEACHER && homework.group_id) {
      await ensureTeacherInGroup(
        this.prisma,
        currentUser.id,
        homework.group_id,
      );
    }

    return this.prisma.homework.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    if (currentUser.role === Role.TEACHER && homework.group_id) {
      await ensureTeacherInGroup(
        this.prisma,
        currentUser.id,
        homework.group_id,
      );
    }

    return this.prisma.homework.delete({ where: { id } });
  }

  private async resolveAuthor(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return { teacher_id: currentUser.id, user_id: null };
    }
    return { user_id: currentUser.id, teacher_id: null };
  }

  private async ensureCanView(currentUser: AuthUser, group_id: number | null) {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return;
    }
    if (!group_id) return;

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return;
    }

    if (currentUser.role === Role.STUDENT) {
      const link = await this.prisma.studentGroup.findFirst({
        where: {
          student_id: currentUser.id,
          group_id,
          status: 'active',
        },
      });
      if (!link) {
        throw new ForbiddenException('Siz bu guruh talabasi emassiz');
      }
    }
  }

  private async buildAccessFilter(
    currentUser: AuthUser,
  ): Promise<Prisma.HomeworkWhereInput> {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return {};
    }

    if (currentUser.role === Role.TEACHER) {
      const links = await this.prisma.groupTeacher.findMany({
        where: { teacher_id: currentUser.id, status: 'active' },
        select: { group_id: true },
      });
      return { group_id: { in: links.map((l) => l.group_id) } };
    }

    const links = await this.prisma.studentGroup.findMany({
      where: { student_id: currentUser.id, status: 'active' },
      select: { group_id: true },
    });
    return { group_id: { in: links.map((l) => l.group_id) } };
  }
}
