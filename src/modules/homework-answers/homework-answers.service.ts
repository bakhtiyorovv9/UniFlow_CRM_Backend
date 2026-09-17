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
import { CreateHomeworkAnswerDto } from './dto/create-homework-answers.dto.js';
import { QueryHomeworkAnswersDto } from './dto/query-homework-answers.dto.js';
import { UpdateHomeworkAnswerDto } from './dto/update-homework-answers.dto.js';

@Injectable()
export class HomeworkAnswersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHomeworkAnswerDto, currentUser: AuthUser) {
    // Faqat STUDENT javob yuboradi (controller Roles ham cheklaydi)
    if (currentUser.role !== Role.STUDENT) {
      throw new ForbiddenException('Faqat talaba javob yuborishi mumkin');
    }

    // Talaba shu vazifaning guruhida borligini tekshirish
    const homework = await this.prisma.homework.findUnique({
      where: { id: dto.homework_id },
      select: { group_id: true },
    });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    if (homework.group_id) {
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

    return this.prisma.homeworkAnswerStudent.create({
      data: {
        ...dto,
        student_id: currentUser.id,
      },
      include: {
        homework: { select: { id: true, title: true, group_id: true } },
        students: { select: { id: true, full_name: true } },
      },
    });
  }

  async findAll(query: QueryHomeworkAnswersDto, currentUser: AuthUser) {
    const {
      page = 1,
      limit = 10,
      homeworkStatus,
      homework_id,
      student_id,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HomeworkAnswerStudentWhereInput = {
      ...(homeworkStatus && { homeworkStatus }),
      ...(homework_id && { homework_id }),
      ...(student_id && { student_id }),
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
          students: { select: { id: true, full_name: true } },
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

    // TEACHER faqat oʻz guruhidagi javobga tegishi mumkin
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

    // Student faqat oʻz javobini oʻchira oladi
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

  // === yordamchi ===

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

    // TEACHER — faqat o'z guruhi vazifalari javoblari
    const links = await this.prisma.groupTeacher.findMany({
      where: { teacher_id: currentUser.id, status: 'active' },
      select: { group_id: true },
    });
    return {
      homework: { group_id: { in: links.map((l) => l.group_id) } },
    };
  }
}
