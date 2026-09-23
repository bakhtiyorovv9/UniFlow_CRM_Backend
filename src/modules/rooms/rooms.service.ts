import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateRoomDto } from './dto/create-rooms.dto.js';
import { QueryRoomsDto } from './dto/query-rooms.dto.js';
import { UpdateRoomDto } from './dto/update-rooms.dto.js';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({ data: dto });
  }

  async findAll(query: QueryRoomsDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RoomWhereInput = {
      ...(status && { status }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              groups: { where: { status: { in: ['active', 'planned'] } } },
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Xona topilmadi');
    return room;
  }

  update(id: number, dto: UpdateRoomDto) {
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.room.delete({ where: { id } });
  }
}
