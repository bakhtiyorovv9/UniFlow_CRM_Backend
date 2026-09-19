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
import {
  ensureGroupOpen,
  tashkentDayRange,
} from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateLessonDto } from './dto/create-lessons.dto.js';
import { QueryLessonsDto } from './dto/query-lessons.dto.js';
import { UpdateLessonDto } from './dto/update-lessons.dto.js';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLessonDto, currentUser: AuthUser) {
    const authorData = await this.resolveAuthor(currentUser, dto.group_id);
    await ensureGroupOpen(this.prisma, dto.group_id);
    const { start, end } = tashkentDayRange(new Date());
    const today = await this.prisma.lesson.findFirst({
      where: { group_id: dto.group_id, created_at: { gte: start, lt: end } },
      select: { topic: true },
    });
    if (today) {
      throw new BadRequestException(
        `Bu guruhga bugun dars allaqachon qo'shilgan: "${today.topic}". Uni tahrirlang`,
      );
    }

    return this.prisma.lesson.create({
      data: {
        ...dto,
        ...authorData,
      },
      include: {
        groups: { select: { id: true, name: true } },
        teachers: { select: { id: true, full_name: true } },
        users: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async findAll(query: QueryLessonsDto, currentUser: AuthUser) {
    const { page = 1, limit = 10, search, status, group_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      ...(status && { status }),
      ...(group_id && { group_id }),
      ...(search && {
        OR: [
          { topic: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          groups: { select: { id: true, name: true } },
          teachers: { select: { id: true, full_name: true } },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        groups: true,
        teachers: { omit: { password: true } },
        users: { omit: { password: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    await this.ensureCanView(currentUser, lesson.group_id);
    return lesson;
  }

  async update(id: number, dto: UpdateLessonDto, currentUser: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, lesson.group_id);
    }
    await ensureGroupOpen(this.prisma, lesson.group_id);

    return this.prisma.lesson.update({
      where: { id },
      data: dto,
      include: {
        groups: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, lesson.group_id);
    }

    return this.prisma.lesson.delete({ where: { id } });
  }

  private async resolveAuthor(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return { teacher_id: currentUser.id, user_id: null };
    }
    return { user_id: currentUser.id, teacher_id: null };
  }

  private async ensureCanView(currentUser: AuthUser, group_id: number) {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return;
    }

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
  ): Promise<Prisma.LessonWhereInput> {
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
