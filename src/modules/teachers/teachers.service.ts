import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { CreateTeacherDto } from './dto/create-teachers.dto.js';
import { QueryTeachersDto } from './dto/query-teachers.dto.js';
import { UpdateTeacherDto } from './dto/update-teachers.dto.js';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create({ send_email, ...dto }: CreateTeacherDto) {
    const created = await this.prisma.teacher.create({
      data: {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
      },
      omit: { password: true },
    });
    return {
      ...created,
      ...(await this.notifyCredentials(created, dto.password, 'created', {
        send_email,
      })),
    };
  }

  async findAll(query: QueryTeachersDto) {
    const { page = 1, limit = 10, search, status, archived } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TeacherWhereInput = {
      archived_at: archived ? { not: null } : null,
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

    return {
      items: await this.withStats(items),
      total,
      page,
      limit,
    };
  }

  async counts() {
    const [byStatus, archived] = await Promise.all([
      this.prisma.teacher.groupBy({
        by: ['status'],
        where: { archived_at: null },
        _count: { _all: true },
      }),
      this.prisma.teacher.count({ where: { archived_at: { not: null } } }),
    ]);

    const counts = { active: 0, inactive: 0, freeze: 0 };
    let all = 0;
    for (const row of byStatus) {
      counts[row.status] = row._count._all;
      all += row._count._all;
    }

    return { all, ...counts, archived };
  }

  private async withStats<T extends { id: number }>(items: T[]) {
    const ids = items.map((item) => item.id);
    if (!ids.length) return [];

    const links = await this.prisma.groupTeacher.findMany({
      where: { teacher_id: { in: ids }, status: 'active' },
      select: {
        teacher_id: true,
        Group: {
          select: {
            id: true,
            courses: { select: { name: true } },
            _count: {
              select: { studentGroups: { where: { status: 'active' } } },
            },
          },
        },
      },
    });

    const groupIds = [...new Set(links.map((link) => link.Group.id))];
    const rows = groupIds.length
      ? await this.prisma.attendance.groupBy({
          by: ['group_id', 'isPresent'],
          where: { group_id: { in: groupIds } },
          _count: { _all: true },
        })
      : [];

    const rateByGroup = new Map<number, { present: number; total: number }>();
    for (const row of rows) {
      const entry = rateByGroup.get(row.group_id) ?? { present: 0, total: 0 };
      entry.total += row._count._all;
      if (row.isPresent) entry.present += row._count._all;
      rateByGroup.set(row.group_id, entry);
    }

    type Stats = {
      groups: number;
      students: number;
      courses: Set<string>;
      present: number;
      total: number;
    };
    const byTeacher = new Map<number, Stats>();
    for (const link of links) {
      const entry: Stats = byTeacher.get(link.teacher_id) ?? {
        groups: 0,
        students: 0,
        courses: new Set(),
        present: 0,
        total: 0,
      };
      entry.groups += 1;
      entry.students += link.Group._count.studentGroups;
      entry.courses.add(link.Group.courses.name);
      const rate = rateByGroup.get(link.Group.id);
      if (rate) {
        entry.present += rate.present;
        entry.total += rate.total;
      }
      byTeacher.set(link.teacher_id, entry);
    }

    return items.map((item) => {
      const stats = byTeacher.get(item.id);
      return {
        ...item,
        groups_count: stats?.groups ?? 0,
        students_count: stats?.students ?? 0,
        courses: stats ? [...stats.courses] : [],
        attendance: { present: stats?.present ?? 0, total: stats?.total ?? 0 },
      };
    });
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");
    return teacher;
  }

  async update(id: number, { send_email, ...dto }: UpdateTeacherDto) {
    const data: Prisma.TeacherUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data,
      omit: { password: true },
    });
    if (!dto.password) return updated;
    return {
      ...updated,
      ...(await this.notifyCredentials(
        updated,
        dto.password,
        'password_changed',
        { send_email },
      )),
    };
  }

  async archive(id: number) {
    const teacher = await this.findOne(id);
    if (teacher.archived_at) {
      throw new BadRequestException("O'qituvchi allaqachon arxivda");
    }

    const [, archived] = await this.prisma.$transaction([
      this.prisma.groupTeacher.updateMany({
        where: { teacher_id: id, status: { in: ['active', 'planned'] } },
        data: { status: 'inactive' },
      }),
      this.prisma.teacher.update({
        where: { id },
        data: { archived_at: new Date() },
        omit: { password: true },
      }),
    ]);
    return archived;
  }

  async restore(id: number) {
    const teacher = await this.findOne(id);
    if (!teacher.archived_at) {
      throw new BadRequestException("O'qituvchi arxivda emas");
    }

    return this.prisma.teacher.update({
      where: { id },
      data: { archived_at: null },
      omit: { password: true },
    });
  }

  async remove(id: number) {
    const teacher = await this.findOne(id);
    if (!teacher.archived_at) {
      throw new BadRequestException(
        "Butunlay o'chirishdan oldin o'qituvchini arxivga yuboring",
      );
    }

    const [, deleted] = await this.prisma.$transaction([
      this.prisma.groupTeacher.deleteMany({ where: { teacher_id: id } }),
      this.prisma.teacher.delete({
        where: { id },
        omit: { password: true },
      }),
    ]);
    return deleted;
  }

  private async notifyCredentials(
    account: { full_name: string; email: string; phone: string },
    password: string,
    kind: 'created' | 'password_changed',
    channels: { send_email?: boolean },
  ) {
    if (!channels.send_email) return {};
    const email_result = await this.mail.sendCredentials({
      name: account.full_name,
      email: account.email,
      phone: account.phone,
      password,
      role: 'teacher',
      kind,
    });
    return { email_result };
  }
}
