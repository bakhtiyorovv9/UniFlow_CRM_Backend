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
import { CreateHomeworkResultDto } from './dto/create-homework-results.dto.js';

@Injectable()
export class HomeworkResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateHomeworkResultDto, currentUser: AuthUser) {
    // Javobni topib, homework va group_id ni olamiz
    const answer = await this.prisma.homeworkAnswerStudent.findUnique({
      where: { id: dto.homework_answer_id },
      include: {
        homework: { select: { id: true, group_id: true } },
      },
    });
    if (!answer) throw new NotFoundException('Javob topilmadi');
    if (!answer.homework.group_id) {
      throw new NotFoundException('Vazifa guruhga bogʻlanmagan');
    }

    const group_id = answer.homework.group_id;
    const homework_id = answer.homework.id;

    // Egalik qoidasi: TEACHER faqat oʻz guruhi
    const authorData = await this.resolveAuthor(currentUser, group_id);

    // upsert: shu javobga shu foydalanuvchi tomonidan qoʻyilgan baho bormi?
    // Unique kaliti: (homework_answer_id, teacher_id, user_id, group_id, homework_id)
    const existing = await this.prisma.homeworkResult.findFirst({
      where: {
        homework_answer_id: dto.homework_answer_id,
        homework_id,
        group_id,
        teacher_id: authorData.teacher_id,
        user_id: authorData.user_id,
      },
    });

    if (existing) {
      // Yangilash
      return this.prisma.homeworkResult.update({
        where: { id: existing.id },
        data: {
          grade: dto.grade,
          title: dto.title,
          homeworkStatus: dto.homeworkStatus,
        },
      });
    }

    // Yangi yaratish
    const created = await this.prisma.homeworkResult.create({
      data: {
        homework_answer_id: dto.homework_answer_id,
        homework_id,
        group_id,
        grade: dto.grade,
        title: dto.title,
        homeworkStatus: dto.homeworkStatus,
        ...authorData,
      },
    });

    // Ayni paytda javobning statusini ham yangilaymiz — shunda talaba koʻradi
    await this.prisma.homeworkAnswerStudent.update({
      where: { id: dto.homework_answer_id },
      data: { homeworkStatus: dto.homeworkStatus },
    });

    return created;
  }

  async findAll(currentUser: AuthUser) {
    const where = await this.buildAccessFilter(currentUser);

    return this.prisma.homeworkResult.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        homeworkAnswerStudent: {
          include: {
            students: { select: { id: true, full_name: true } },
          },
        },
        homework: { select: { id: true, title: true } },
        groups: { select: { id: true, name: true } },
        teachers: { select: { id: true, full_name: true } },
      },
    });
  }

  async findOne(id: number, currentUser: AuthUser) {
    const result = await this.prisma.homeworkResult.findUnique({
      where: { id },
      include: {
        homeworkAnswerStudent: {
          include: { students: { omit: { password: true } } },
        },
        homework: true,
        groups: true,
        teachers: { omit: { password: true } },
        users: { omit: { password: true } },
      },
    });
    if (!result) throw new NotFoundException('Baho topilmadi');

    await this.ensureCanView(currentUser, result);
    return result;
  }

  async remove(id: number, currentUser: AuthUser) {
    const result = await this.prisma.homeworkResult.findUnique({
      where: { id },
    });
    if (!result) throw new NotFoundException('Baho topilmadi');

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, result.group_id);
    }

    return this.prisma.homeworkResult.delete({ where: { id } });
  }

  // === yordamchi ===

  private async resolveAuthor(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return { teacher_id: currentUser.id, user_id: null };
    }
    return { user_id: currentUser.id, teacher_id: null };
  }

  private async ensureCanView(
    currentUser: AuthUser,
    result: { group_id: number; homeworkAnswerStudent: { student_id: number } },
  ) {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return;
    }

    if (currentUser.role === Role.STUDENT) {
      if (result.homeworkAnswerStudent.student_id !== currentUser.id) {
        throw new ForbiddenException('Bu baho sizniki emas');
      }
      return;
    }

    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, result.group_id);
    }
  }

  private async buildAccessFilter(
    currentUser: AuthUser,
  ): Promise<Prisma.HomeworkResultWhereInput> {
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return {};
    }

    if (currentUser.role === Role.STUDENT) {
      return {
        homeworkAnswerStudent: { student_id: currentUser.id },
      };
    }

    // TEACHER
    const links = await this.prisma.groupTeacher.findMany({
      where: { teacher_id: currentUser.id, status: 'active' },
      select: { group_id: true },
    });
    return { group_id: { in: links.map((l) => l.group_id) } };
  }
}
