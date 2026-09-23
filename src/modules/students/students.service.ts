import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { CreateStudentDto } from './dto/create-students.dto.js';
import { QueryStudentsDto } from './dto/query-students.dto.js';
import { UpdateStudentDto } from './dto/update-students.dto.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create({ send_email, ...dto }: CreateStudentDto) {
    const created = await this.prisma.student.create({
      data: {
        ...dto,
        birth_date: new Date(dto.birth_date),
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

  async counts() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [byStatus, archived, newThisMonth] = await Promise.all([
      this.prisma.student.groupBy({
        by: ['status'],
        where: { archived_at: null },
        _count: { _all: true },
      }),
      this.prisma.student.count({ where: { archived_at: { not: null } } }),
      this.prisma.student.count({
        where: { archived_at: null, created_at: { gte: monthStart } },
      }),
    ]);

    const counts = { active: 0, inactive: 0, freeze: 0, graduated: 0 };
    let all = 0;
    for (const row of byStatus) {
      counts[row.status] = row._count._all;
      all += row._count._all;
    }

    return { all, ...counts, archived, new_this_month: newThisMonth };
  }

  async findAll(query: QueryStudentsDto) {
    const { page = 1, limit = 10, search, status, archived } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
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
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        omit: { password: true },
        include: {
          studentGroups: {
            where: { status: 'active' },
            select: {
              id: true,
              group_id: true,
              groups: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    const ids = items.map((item) => item.id);
    const rows = ids.length
      ? await this.prisma.attendance.groupBy({
          by: ['student_id', 'isPresent'],
          where: { student_id: { in: ids } },
          _count: { _all: true },
        })
      : [];

    const byStudent = new Map<number, { present: number; total: number }>();
    for (const row of rows) {
      const entry = byStudent.get(row.student_id) ?? { present: 0, total: 0 };
      entry.total += row._count._all;
      if (row.isPresent) entry.present += row._count._all;
      byStudent.set(row.student_id, entry);
    }

    return {
      items: items.map((item) => ({
        ...item,
        attendance: byStudent.get(item.id) ?? { present: 0, total: 0 },
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!student) throw new NotFoundException('Talaba topilmadi');
    return student;
  }

  async update(id: number, { send_email, ...dto }: UpdateStudentDto) {
    const data: Prisma.StudentUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.birth_date) {
      data.birth_date = new Date(dto.birth_date);
    }

    const updated = await this.prisma.student.update({
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
    const student = await this.findOne(id);
    if (student.archived_at) {
      throw new BadRequestException('Talaba allaqachon arxivda');
    }

    const [, archived] = await this.prisma.$transaction([
      this.prisma.studentGroup.updateMany({
        where: { student_id: id, status: 'active' },
        data: { status: 'inactive' },
      }),
      this.prisma.student.update({
        where: { id },
        data: { archived_at: new Date() },
        omit: { password: true },
      }),
    ]);
    return archived;
  }

  async restore(id: number) {
    const student = await this.findOne(id);
    if (!student.archived_at) {
      throw new BadRequestException('Talaba arxivda emas');
    }

    return this.prisma.student.update({
      where: { id },
      data: { archived_at: null },
      omit: { password: true },
    });
  }

  async remove(id: number) {
    const student = await this.findOne(id);
    if (!student.archived_at) {
      throw new BadRequestException(
        "Butunlay o'chirishdan oldin talabani arxivga yuboring",
      );
    }

    const [, , , , deleted] = await this.prisma.$transaction([
      this.prisma.homeworkResult.deleteMany({
        where: { homeworkAnswerStudent: { student_id: id } },
      }),
      this.prisma.homeworkAnswerStudent.deleteMany({
        where: { student_id: id },
      }),
      this.prisma.attendance.deleteMany({ where: { student_id: id } }),
      this.prisma.payment.deleteMany({ where: { student_id: id } }),
      this.prisma.student.delete({
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
      role: 'student',
      kind,
    });
    return { email_result };
  }
}
