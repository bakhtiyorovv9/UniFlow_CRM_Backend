import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Prisma } from '../../../generated/prisma/client.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { ensureTeacherInGroup } from '../../common/utils/ensure-teacher-in-group.js';
import { ensureGroupOpen } from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class LessonVideosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    lesson_id: number,
    file: Express.Multer.File | undefined,
    currentUser: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('Video fayl yuborilmagan');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lesson_id },
      select: { id: true, group_id: true },
    });
    if (!lesson) {
      await unlink(file.path).catch(() => {});
      throw new NotFoundException('Dars topilmadi');
    }

    try {
      await ensureGroupOpen(this.prisma, lesson.group_id);
    } catch (e) {
      await unlink(file.path).catch(() => {});
      throw e;
    }

    if (currentUser.role === Role.TEACHER) {
      try {
        await ensureTeacherInGroup(
          this.prisma,
          currentUser.id,
          lesson.group_id,
        );
      } catch (e) {
        await unlink(file.path).catch(() => {});
        throw e;
      }
    }

    return this.prisma.lessonVideo.create({
      data: {
        lesson_id: lesson.id,
        group_id: lesson.group_id,
        originalname: file.originalname,
        video_url: `/uploads/videos/${file.filename}`,
        size_mb: Number((file.size / 1024 / 1024).toFixed(2)),
      },
    });
  }

  async findAll(
    currentUser: AuthUser,
    lesson_id?: number,
    group_id?: number,
    limit?: number,
  ) {
    const where: Prisma.LessonVideoWhereInput = {
      ...(lesson_id && { lesson_id }),
      ...(group_id && { group_id }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    return this.prisma.lessonVideo.findMany({
      where,
      ...(limit && { take: limit }),
      orderBy: { created_at: 'desc' },
      include: {
        lesson: { select: { id: true, topic: true } },
        groups: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: number, currentUser: AuthUser) {
    const video = await this.prisma.lessonVideo.findUnique({
      where: { id },
      include: { lesson: true, groups: true },
    });
    if (!video) throw new NotFoundException('Video topilmadi');

    await this.ensureCanView(currentUser, video.group_id);
    return video;
  }

  async remove(id: number, currentUser: AuthUser) {
    const video = await this.prisma.lessonVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, video.group_id);
    }

    await this.prisma.lessonVideo.delete({ where: { id } });

    const filename = video.video_url.replace('/uploads/videos/', '');
    const filepath = join(process.cwd(), 'uploads', 'videos', filename);
    await unlink(filepath).catch(() => {});

    return { deleted: true, id };
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
  ): Promise<Prisma.LessonVideoWhereInput> {
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
