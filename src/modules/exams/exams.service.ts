import {
  BadRequestException,
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
  tashkentDayRange,
} from '../../common/utils/group-rules.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { QueryExamsDto } from './dto/query-exams.dto.js';
import { SaveExamResultsDto } from './dto/save-exam-results.dto.js';
import { SubmitExamAnswerDto } from './dto/submit-exam-answer.dto.js';
import { UpdateExamDto } from './dto/update-exam.dto.js';

const STUDENT_BRIEF = { select: { id: true, full_name: true, photo: true } };

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExamDto, currentUser: AuthUser) {
    const author = await this.resolveAuthor(currentUser, dto.group_id);
    await ensureGroupOpen(this.prisma, dto.group_id);

    const max_score = dto.max_score ?? 100;
    const pass_score = dto.pass_score ?? 60;
    this.ensureScores(max_score, pass_score);

    const examDate = new Date(dto.exam_date);
    if (examDate < tashkentDayRange(new Date()).start) {
      throw new BadRequestException(
        "Imtihon sanasi o'tib ketgan kun bo'lishi mumkin emas",
      );
    }
    const endDate = new Date(dto.end_date);
    this.ensureWindow(examDate, endDate);

    return this.prisma.exam.create({
      data: {
        group_id: dto.group_id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        exam_date: examDate,
        end_date: endDate,
        max_score,
        pass_score,
        ...author,
      },
    });
  }

  async findAll(query: QueryExamsDto, currentUser: AuthUser) {
    const isStudent = currentUser.role === Role.STUDENT;
    const where: Prisma.ExamWhereInput = {
      ...(query.group_id && { group_id: query.group_id }),
      ...(await this.buildAccessFilter(currentUser)),
    };

    return this.prisma.exam.findMany({
      where,
      orderBy: { exam_date: 'desc' },
      include: {
        groups: { select: { id: true, name: true } },
        teachers: { select: { id: true, full_name: true } },
        results: {
          ...(isStudent && { where: { student_id: currentUser.id } }),
          select: {
            student_id: true,
            attended: true,
            score: true,
            comment: true,
            answer_text: true,
            answer_file: true,
            submitted_at: true,
          },
        },
      },
    });
  }

  async findOne(id: number, currentUser: AuthUser) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: { group_id: true },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    await this.ensureCanView(currentUser, exam.group_id);

    const isStudent = currentUser.role === Role.STUDENT;
    return this.prisma.exam.findUnique({
      where: { id },
      include: {
        groups: { select: { id: true, name: true, status: true } },
        teachers: { select: { id: true, full_name: true } },
        users: { select: { id: true, first_name: true, last_name: true } },
        results: {
          ...(isStudent && { where: { student_id: currentUser.id } }),
          orderBy: { student_id: 'asc' },
          include: { students: STUDENT_BRIEF },
        },
      },
    });
  }

  async update(id: number, dto: UpdateExamDto, currentUser: AuthUser) {
    const exam = await this.getExam(id);
    await this.resolveAuthor(currentUser, exam.group_id);
    await ensureGroupOpen(this.prisma, exam.group_id);

    const max_score = dto.max_score ?? exam.max_score;
    const pass_score = dto.pass_score ?? exam.pass_score;
    this.ensureScores(max_score, pass_score);
    const nextStart = dto.exam_date ? new Date(dto.exam_date) : exam.exam_date;
    const nextEnd = dto.end_date ? new Date(dto.end_date) : exam.end_date;
    if (nextEnd) this.ensureWindow(nextStart, nextEnd);

    if (dto.max_score !== undefined && dto.max_score < exam.max_score) {
      const higher = await this.prisma.examResult.count({
        where: { exam_id: id, score: { gt: dto.max_score } },
      });
      if (higher > 0) {
        throw new BadRequestException(
          `${higher} ta talabaning bali yangi maksimal balldan (${dto.max_score}) yuqori. Avval baholarni o'zgartiring`,
        );
      }
    }

    return this.prisma.exam.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
        ...(dto.exam_date && { exam_date: new Date(dto.exam_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
        max_score,
        pass_score,
      },
    });
  }

  async saveResults(
    id: number,
    dto: SaveExamResultsDto,
    currentUser: AuthUser,
  ) {
    const exam = await this.getExam(id);
    const author = await this.resolveAuthor(currentUser, exam.group_id);
    await ensureGroupOpen(this.prisma, exam.group_id);

    if (exam.exam_date > new Date()) {
      throw new BadRequestException(
        'Imtihon hali boshlanmagan. Davomat va baholarni imtihon vaqtidan keyin kiriting',
      );
    }

    const ids = dto.results.map((item) => item.student_id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Bir talaba ikki marta yuborilgan');
    }
    const members = await this.prisma.studentGroup.count({
      where: {
        group_id: exam.group_id,
        status: 'active',
        student_id: { in: ids },
      },
    });
    if (members !== ids.length) {
      throw new BadRequestException(
        "Ro'yxatdagi ba'zi talabalar bu guruhda o'qimaydi",
      );
    }

    for (const item of dto.results) {
      if (item.attended && (item.score === undefined || item.score === null)) {
        throw new BadRequestException(
          "Imtihonga kelgan har bir talabaga ball qo'yilishi kerak",
        );
      }
      if (item.attended && item.score! > exam.max_score) {
        throw new BadRequestException(
          `Ball ${exam.max_score} dan oshmasligi kerak`,
        );
      }
    }

    await this.prisma.$transaction(
      dto.results.map((item) => {
        const data = {
          attended: item.attended,
          score: item.attended ? item.score! : null,
          comment: item.comment?.trim() || null,
          ...author,
        };
        return this.prisma.examResult.upsert({
          where: {
            exam_id_student_id: { exam_id: id, student_id: item.student_id },
          },
          create: { exam_id: id, student_id: item.student_id, ...data },
          update: data,
        });
      }),
    );

    return this.findOne(id, currentUser);
  }

  async submitAnswer(
    id: number,
    dto: SubmitExamAnswerDto,
    currentUser: AuthUser,
  ) {
    if (currentUser.role !== Role.STUDENT) {
      throw new ForbiddenException('Faqat talaba javob yuborishi mumkin');
    }
    const exam = await this.getExam(id);
    await this.ensureCanView(currentUser, exam.group_id);
    await ensureGroupOpen(this.prisma, exam.group_id);

    if (exam.exam_date > new Date()) {
      throw new BadRequestException(
        'Imtihon hali boshlanmagan. Javobni imtihon vaqtida yuborasiz',
      );
    }
    if (exam.end_date && exam.end_date < new Date()) {
      throw new BadRequestException(
        'Imtihon vaqti tugagan. Javob qabul qilinmaydi',
      );
    }
    const answer_text = dto.answer_text?.trim() || null;
    const answer_file = dto.answer_file?.trim() || null;
    if (!answer_text && !answer_file) {
      throw new BadRequestException(
        'Javob matnini yozing yoki fayl biriktiring',
      );
    }

    const existing = await this.prisma.examResult.findUnique({
      where: {
        exam_id_student_id: { exam_id: id, student_id: currentUser.id },
      },
    });
    if (existing && existing.score !== null) {
      throw new BadRequestException(
        "Imtihon baholangan. Javobni endi o'zgartirib bo'lmaydi",
      );
    }
    if (existing && !existing.attended) {
      throw new BadRequestException(
        "Siz imtihonga kelmagan deb belgilangansiz. O'qituvchiga murojaat qiling",
      );
    }

    const data = {
      answer_text,
      answer_file,
      submitted_at: new Date(),
      attended: true,
    };
    return this.prisma.examResult.upsert({
      where: {
        exam_id_student_id: { exam_id: id, student_id: currentUser.id },
      },
      create: { exam_id: id, student_id: currentUser.id, ...data },
      update: data,
    });
  }

  async remove(id: number, currentUser: AuthUser) {
    const exam = await this.getExam(id);
    await this.resolveAuthor(currentUser, exam.group_id);

    if (currentUser.role === Role.TEACHER) {
      const results = await this.prisma.examResult.count({
        where: { exam_id: id },
      });
      if (results > 0) {
        throw new ForbiddenException(
          "Baholangan imtihonni faqat administrator o'chira oladi",
        );
      }
    }

    return this.prisma.exam.delete({ where: { id } });
  }

  private async getExam(id: number) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    return exam;
  }

  private ensureWindow(start: Date, end: Date) {
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException(
        "Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak",
      );
    }
    if (end.getTime() - start.getTime() > 7 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException(
        "Imtihon 7 kundan uzun bo'lishi mumkin emas",
      );
    }
  }

  private ensureScores(max_score: number, pass_score: number) {
    if (pass_score > max_score) {
      throw new BadRequestException(
        "O'tish bali maksimal balldan katta bo'lishi mumkin emas",
      );
    }
  }

  private async resolveAuthor(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
      return { teacher_id: currentUser.id, user_id: null };
    }
    if (
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SUPERADMIN
    ) {
      return { user_id: currentUser.id, teacher_id: null };
    }
    throw new ForbiddenException("Ruxsat yo'q");
  }

  private async ensureCanView(currentUser: AuthUser, group_id: number) {
    if (currentUser.role === Role.TEACHER) {
      await ensureTeacherInGroup(this.prisma, currentUser.id, group_id);
    }
    if (currentUser.role === Role.STUDENT) {
      const link = await this.prisma.studentGroup.findFirst({
        where: { student_id: currentUser.id, group_id, status: 'active' },
      });
      if (!link) throw new ForbiddenException('Siz bu guruh talabasi emassiz');
    }
  }

  private async buildAccessFilter(
    currentUser: AuthUser,
  ): Promise<Prisma.ExamWhereInput> {
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
      return { group_id: { in: links.map((link) => link.group_id) } };
    }
    const links = await this.prisma.studentGroup.findMany({
      where: { student_id: currentUser.id, status: 'active' },
      select: { group_id: true },
    });
    return { group_id: { in: links.map((link) => link.group_id) } };
  }
}
