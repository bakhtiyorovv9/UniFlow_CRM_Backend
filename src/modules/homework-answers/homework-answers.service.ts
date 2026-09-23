import {
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
  homeworkDeadline,
} from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateHomeworkAnswerDto } from './dto/create-homework-answers.dto.js';
import { QueryHomeworkAnswersDto } from './dto/query-homework-answers.dto.js';
import { UpdateHomeworkAnswerDto } from './dto/update-homework-answers.dto.js';

@Injectable()
export class HomeworkAnswersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHomeworkAnswerDto, currentUser: AuthUser) {
    if (currentUser.role !== Role.STUDENT) {
      throw new ForbiddenException('Faqat talaba javob yuborishi mumkin');
    }

    const homework = await this.prisma.homework.findUnique({
      where: { id: dto.homework_id },
      select: { group_id: true, created_at: true },
    });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');
    const late = Date.now() > homeworkDeadline(homework.created_at).getTime();

    if (homework.group_id) {
      await ensureGroupOpen(this.prisma, homework.group_id);
      const link = await this.prisma.studentGroup.findFirst({
        where: {
          student_id: currentUser.id,
          group_id: homework.group_id,
          status: 'active',
        },
      });
      if (!link) {
        throw new ForbiddenException('Siz bu guruh talabasi emassiz');
      }
    }

    const answer = await this.prisma.homeworkAnswerStudent.create({
      data: {
        ...dto,
        student_id: currentUser.id,
        ...(late && { homeworkStatus: 'REJECTED' as const }),
      },
      include: {
        homework: { select: { id: true, title: true, group_id: true } },
        students: { select: { id: true, full_name: true } },
      },
    });

    if (late && homework.group_id) {
      await this.prisma.homeworkResult.create({
        data: {
          homework_answer_id: answer.id,
          homework_id: dto.homework_id,
          group_id: homework.group_id,
          grade: 0,
          title:
            "Topshirish muddati (24 soat) o'tib ketgan. Javob avtomatik qaytarildi",
          homeworkStatus: 'REJECTED',
        },
      });
    }

    return { ...answer, late };
  }

  async findAll(query: QueryHomeworkAnswersDto, currentUser: AuthUser) {
    const {
      page = 1,
      limit = 10,
      homeworkStatus,
      homework_id,
      student_id,
      group_id,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HomeworkAnswerStudentWhereInput = {
      ...(homeworkStatus && { homeworkStatus }),
      ...(homework_id && { homework_id }),
      ...(student_id && { student_id }),
      ...(group_id && { homework: { group_id } }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.homeworkAnswerStudent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          homework: { select: { id: true, title: true, group_id: true } },
          students: { select: { id: true, full_name: true, photo: true } },
          homeworkResults: {
            orderBy: { update_at: 'desc' },
            take: 1,
            select: {
              id: true,
              grade: true,
              title: true,
              homeworkStatus: true,
              update_at: true,
            },
          },
        },
      }),
      this.prisma.homeworkAnswerStudent.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: number, currentUser: AuthUser) {
    const answer = await this.prisma.homeworkAnswerStudent.findUnique({
      where: { id },
      include: {
        homework: true,
        students: { omit: { password: true } },
        homeworkResults: true,
      },
    });
    if (!answer) throw new NotFoundException('Javob topilmadi');

    await this.ensureCanView(currentUser, answer);
    return answer;
  }

  async update(
    id: number,
    dto: UpdateHomeworkAnswerDto,
    currentUser: AuthUser,
  ) {
    const answer = await this.prisma.homeworkAnswerStudent.findUnique({
      where: { id },
      include: { homework: { select: { group_id: true } } },
    });
    if (!answer) throw new NotFoundException('Javob topilmadi');

    if (currentUser.role === Role.TEACHER && answer.homework.group_id) {
      await ensureTeacherInGroup(
        this.prisma,
        currentUser.id,
        answer.homework.group_id,
      );
    }

    return this.prisma.homeworkAnswerStudent.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const answer = await this.prisma.homeworkAnswerStudent.findUnique({
      where: { id },
      include: { homework: { select: { group_id: true } } },
    });
    if (!answer) throw new NotFoundException('Javob topilmadi');

    if (
      currentUser.role === Role.STUDENT &&
      answer.student_id !== currentUser.id
    ) {
      throw new ForbiddenException('Bu javob sizniki emas');
    }
    if (currentUser.role === Role.TEACHER && answer.homework.group_id) {
      await ensureTeacherInGroup(
        this.prisma,
        currentUser.id,
        answer.homework.group_id,
      );
    }

    return this.prisma.homeworkAnswerStudent.delete({ where: { id } });
  }

  private async ensureCanView(
    currentUser: AuthUser,
    answer: { student_id: number; homework: { group_id: number | null } },
  ) {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return;
    }

    if (currentUser.role === Role.STUDENT) {
      if (answer.student_id !== currentUser.id) {
        throw new ForbiddenException('Bu javob sizniki emas');
      }
      return;
    }

    if (currentUser.role === Role.TEACHER && answer.homework.group_id) {
      await ensureTeacherInGroup(
        this.prisma,
        currentUser.id,
        answer.homework.group_id,
      );
    }
  }

  private async buildAccessFilter(
    currentUser: AuthUser,
  ): Promise<Prisma.HomeworkAnswerStudentWhereInput> {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return {};
    }

    if (currentUser.role === Role.STUDENT) {
      return { student_id: currentUser.id };
    }

    const links = await this.prisma.groupTeacher.findMany({
      where: { teacher_id: currentUser.id, status: 'active' },
      select: { group_id: true },
    });
    return {
      homework: { group_id: { in: links.map((l) => l.group_id) } },
    };
  }
}
