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
