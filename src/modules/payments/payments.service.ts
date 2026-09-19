import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreatePaymentDto } from './dto/create-payments.dto.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { UpdatePaymentDto } from './dto/update-payments.dto.js';

const include = {
  students: { select: { id: true, full_name: true, phone: true } },
  groups: { select: { id: true, name: true } },
  users: { select: { id: true, first_name: true, last_name: true } },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, currentUser: AuthUser) {
    await this.ensureReferences(dto.student_id, dto.group_id);

    return this.prisma.payment.create({
      data: {
        ...dto,
        paid_at: dto.paid_at ? new Date(dto.paid_at) : undefined,
        user_id: currentUser.type === 'user' ? currentUser.id : null,
      },
      include,
    });
  }

  async findAll(query: QueryPaymentsDto) {
    const {
      page = 1,
      limit = 10,
      search,
      student_id,
      group_id,
      from,
      to,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(student_id && { student_id }),
      ...(group_id && { group_id }),
      ...((from || to) && {
        paid_at: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
      ...(search && {
        students: {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        },
      }),
    };

    const [items, total, aggregate] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ paid_at: 'desc' }, { id: 'desc' }],
        include,
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    return { items, total, page, limit, sum: aggregate._sum.amount ?? 0 };
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include,
    });
    if (!payment) throw new NotFoundException("To'lov topilmadi");
    return payment;
  }

  async update(id: number, dto: UpdatePaymentDto) {
    const payment = await this.findOne(id);
    await this.ensureReferences(
      dto.student_id ?? payment.student_id,
      dto.group_id,
    );

    return this.prisma.payment.update({
      where: { id },
      data: {
        ...dto,
        paid_at: dto.paid_at ? new Date(dto.paid_at) : undefined,
      },
      include,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.payment.delete({ where: { id } });
  }

  private async ensureReferences(student_id: number, group_id?: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: student_id },
      select: { id: true },
    });
    if (!student) throw new BadRequestException('Talaba topilmadi');

    if (group_id) {
      const group = await this.prisma.group.findUnique({
        where: { id: group_id },
        select: { id: true },
      });
      if (!group) throw new BadRequestException('Guruh topilmadi');
    }
  }
}
