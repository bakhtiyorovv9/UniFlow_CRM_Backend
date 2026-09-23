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
import {
  describeSchedule,
  ensureTeacherFree,
  schedulesOverlap,
  type ScheduleInput,
} from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateGroupDto } from './dto/create-groups.dto.js';
import { QueryGroupsDto } from './dto/query-groups.dto.js';
import { UpdateGroupDto } from './dto/update-groups.dto.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    await this.ensureNoConflict(await this.scheduleCandidate(dto), dto.room_id);

    return this.prisma.group.create({
      data: {
        ...dto,
        start_date: new Date(dto.start_date),
      },
      include: {
        courses: true,
        rooms: true,
      },
    });
  }

  async findAll(query: QueryGroupsDto, currentUser?: AuthUser) {
    const { page = 1, limit = 10, search, status, course_id, room_id } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {
      ...(currentUser?.role === Role.TEACHER && {
        GroupTeacher: {
          some: { teacher_id: currentUser.id, status: 'active' },
        },
      }),
      ...(currentUser?.role === Role.STUDENT && {
        studentGroups: {
          some: { student_id: currentUser.id, status: 'active' },
        },
      }),
      ...(status && { status }),
      ...(course_id && { course_id }),
      ...(room_id && { room_id }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          courses: { select: { id: true, name: true, duration_month: true } },
          rooms: { select: { id: true, name: true } },
          GroupTeacher: {
            where: { status: 'active' },
            select: {
              id: true,
              status: true,
              Teacher: { select: { id: true, full_name: true, photo: true } },
            },
          },
          _count: {
            select: { studentGroups: { where: { status: 'active' } } },
          },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  private async findOneForStudent(id: number, studentId: number) {
    const link = await this.prisma.studentGroup.findFirst({
      where: { student_id: studentId, group_id: id, status: 'active' },
    });
    if (!link) throw new ForbiddenException('Siz bu guruh talabasi emassiz');

    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        courses: true,
        rooms: true,
        GroupTeacher: {
          where: { status: 'active' },
          include: {
            Teacher: { select: { id: true, full_name: true, photo: true } },
          },
        },
        studentGroups: {
          where: { student_id: studentId },
          include: {
            students: { select: { id: true, full_name: true, photo: true } },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    return group;
  }

  async findOne(id: number, currentUser?: AuthUser) {
    if (currentUser?.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, id);
    }
    if (currentUser?.role === Role.STUDENT) {
      return this.findOneForStudent(id, currentUser.id);
    }
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        courses: true,
        rooms: true,
        GroupTeacher: {
          include: {
            Teacher: {
              omit: { password: true },
            },
          },
        },
        studentGroups: {
          include: {
            students: {
              omit: { password: true },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    return group;
  }

  async update(id: number, dto: UpdateGroupDto) {
    const scheduleChanged =
      dto.room_id ||
      dto.start_time ||
      dto.week_day ||
      dto.start_date ||
      dto.course_id ||
      (dto.status && ['active', 'planned'].includes(dto.status));
    if (scheduleChanged) {
      const current = await this.prisma.group.findUnique({
        where: { id },
        include: { GroupTeacher: { where: { status: 'active' } } },
      });
      if (!current) throw new NotFoundException('Guruh topilmadi');
      const nextStatus = dto.status ?? current.status;
      if (nextStatus === 'active' || nextStatus === 'planned') {
        const candidate = await this.scheduleCandidate(
          {
            name: dto.name ?? current.name,
            course_id: dto.course_id ?? current.course_id,
            start_date: dto.start_date ?? current.start_date,
            start_time: dto.start_time ?? current.start_time,
            week_day: dto.week_day ?? current.week_day,
          },
          id,
        );
        await this.ensureNoConflict(candidate, dto.room_id ?? current.room_id);
        for (const link of current.GroupTeacher) {
          await ensureTeacherFree(this.prisma, link.teacher_id, candidate);
        }
      }
    }

    const data: Prisma.GroupUpdateInput = { ...dto };
    if (dto.start_date) {
      data.start_date = new Date(dto.start_date);
    }

    return this.prisma.group.update({
      where: { id },
      data,
      include: {
        courses: true,
        rooms: true,
      },
    });
  }

  async remove(id: number) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const [homeworks, answers, videos, examResults] = await Promise.all([
      this.prisma.homework.findMany({
        where: { group_id: id },
        select: { file: true },
      }),
      this.prisma.homeworkAnswerStudent.findMany({
        where: { homework: { group_id: id } },
        select: { file: true },
      }),
      this.prisma.lessonVideo.findMany({
        where: { group_id: id },
        select: { video_url: true },
      }),
      this.prisma.examResult.findMany({
        where: { exam: { group_id: id } },
        select: { answer_file: true },
      }),
    ]);

    const results = await this.prisma.$transaction([
      this.prisma.homeworkResult.deleteMany({ where: { group_id: id } }),
      this.prisma.homeworkResult.deleteMany({
        where: { homework: { group_id: id } },
      }),
      this.prisma.homeworkAnswerStudent.deleteMany({
        where: { homework: { group_id: id } },
      }),
      this.prisma.homework.deleteMany({ where: { group_id: id } }),
      this.prisma.lessonVideo.deleteMany({ where: { group_id: id } }),
      this.prisma.attendance.deleteMany({ where: { group_id: id } }),
      this.prisma.lesson.deleteMany({ where: { group_id: id } }),
      this.prisma.exam.deleteMany({ where: { group_id: id } }),
      this.prisma.studentGroup.deleteMany({ where: { group_id: id } }),
      this.prisma.groupTeacher.deleteMany({ where: { group_id: id } }),
      this.prisma.group.delete({ where: { id } }),
    ]);

    const files = [
      ...homeworks.map((item) => item.file),
      ...answers.map((item) => item.file),
      ...videos.map((item) => item.video_url),
      ...examResults.map((item) => item.answer_file),
    ].filter((file): file is string => Boolean(file?.startsWith('/uploads/')));
    await Promise.all(
      files.map((file) =>
        unlink(join(process.cwd(), file.replace(/^\/+/, ''))).catch(() => {}),
      ),
    );

    return results[results.length - 1];
  }

  private async ensureNoConflict(candidate: ScheduleInput, roomId: number) {
    const others = await this.prisma.group.findMany({
      where: {
        room_id: roomId,
        status: { in: ['active', 'planned'] },
        ...(candidate.id && { id: { not: candidate.id } }),
        week_day: { hasSome: candidate.week_day },
      },
      include: { courses: true },
    });
    const clash = others.find((other) => schedulesOverlap(candidate, other));
    if (clash) {
      throw new BadRequestException(
        `Bu xonada shu vaqtda "${clash.name}" guruhi dars o'tadi (${describeSchedule(clash)})`,
      );
    }
  }

  private async scheduleCandidate(
    input: {
      name: string;
      course_id: number;
      start_date: string | Date;
      start_time: string;
      week_day: string[];
    },
    id?: number,
  ): Promise<ScheduleInput> {
    const course = await this.prisma.course.findUnique({
      where: { id: input.course_id },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return {
      id,
      name: input.name,
      start_date: new Date(input.start_date),
      start_time: input.start_time,
      week_day: input.week_day,
      courses: course,
    };
  }
}
