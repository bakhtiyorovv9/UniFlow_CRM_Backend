import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { ensureTeacherInGroup } from '../../common/utils/ensure-teacher-in-group.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateAttendanceDto } from './dto/create-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto, currentUser: AuthUser) {
    const authorData = await this.resolveAuthor(currentUser, dto.group_id);

    const created = await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendance.create({
          data: {
            group_id: dto.group_id,
            student_id: r.student_id,
            isPresent: r.isPresent,
            ...authorData,
          },
        }),
      ),
    );

    return { count: created.length, items: created };
  }

  async findAll(query: QueryAttendanceDto, currentUser: AuthUser) {
    const { page = 1, limit = 10, group_id, student_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {
      ...(group_id && { group_id }),
      ...(student_id && { student_id }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          students: {
            select: { id: true, full_name: true },
          },
          groups: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        students: { omit: { password: true } },
        groups: true,
      },
    });
    if (!record) throw new NotFoundException('Yozuv topilmadi');

    await this.ensureCanView(currentUser, record.group_id, record.student_id);
    return record;
  }

  async update(id: number, dto: UpdateAttendanceDto, currentUser: AuthUser) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Yozuv topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, record.group_id);
    }

    return this.prisma.attendance.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Yozuv topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, record.group_id);
    }

    return this.prisma.attendance.delete({ where: { id } });
  }

  // === yordamchi metodlar ===

  private async resolveAuthor(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return { teacher_id: currentUser.id, user_id: null };
    }
    return { user_id: currentUser.id, teacher_id: null };
  }

  private async ensureCanView(
    currentUser: AuthUser,
    group_id: number,
    student_id: number,
  ) {
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

    // STUDENT — faqat o'z yozuvini
    if (currentUser.role === Role.STUDENT && currentUser.id !== student_id) {
      throw new ForbiddenException('Bu yozuv sizniki emas');
    }
  }

  private async buildAccessFilter(
    currentUser: AuthUser,
  ): Promise<Prisma.AttendanceWhereInput> {
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

    // STUDENT — faqat o'z yozuvlari
    return { student_id: currentUser.id };
  }
}
