import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../../generated/prisma/client.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateUserDto } from './dto/create-users.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, currentUser: AuthUser) {
    if (dto.role === Role.SUPERADMIN && currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(
        'Faqat SUPERADMIN yangi SUPERADMIN yarata oladi',
      );
    }

    return this.prisma.user.create({
      data: {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
      },
      omit: { password: true },
    });
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 10, search, role, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        omit: { password: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async update(id: number, dto: UpdateUserDto, currentUser: AuthUser) {
    if (dto.role === Role.SUPERADMIN && currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(
        'Faqat SUPERADMIN rolni SUPERADMIN qila oladi',
      );
    }

    const data: Prisma.UserUpdateInput = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    if (id === currentUser.id) {
      throw new ForbiddenException("O'zingizni o'chira olmaysiz");
    }
    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }
}
