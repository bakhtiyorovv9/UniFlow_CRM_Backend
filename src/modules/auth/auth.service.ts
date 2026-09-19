import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/index.js';
import type {
  AccountType,
  AuthUser,
  JwtPayload,
} from '../../common/types/jwt-payload.type.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

type Account = {
  id: number;
  password: string;
  status: string;
  archived: boolean;
  role: Role;
  type: AccountType;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = (dto.login ?? dto.email ?? '').trim();
    let account: Account | null = null;
    for (const candidate of await this.findAccounts(identifier)) {
      if (await bcrypt.compare(dto.password, candidate.password)) {
        account = candidate;
        break;
      }
    }

    if (!account) {
      throw new UnauthorizedException("Login yoki parol noto'g'ri");
    }
    if (account.status !== 'active' || account.archived) {
      throw new ForbiddenException('Akkaunt faol emas');
    }

    return this.generateTokens({
      sub: account.id,
      role: account.role,
      type: account.type,
    });
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      return this.generateTokens({
        sub: payload.sub,
        role: payload.role,
        type: payload.type,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token yaroqsiz yoki muddati tugagan',
      );
    }
  }

  me(user: AuthUser) {
    const query = { where: { id: user.id }, omit: { password: true } } as const;

    if (user.type === 'user') return this.prisma.user.findUnique(query);
    if (user.type === 'teacher') return this.prisma.teacher.findUnique(query);
    return this.prisma.student.findUnique(query);
  }

  private async generateTokens(payload: JwtPayload) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async findAccounts(identifier: string): Promise<Account[]> {
    if (!identifier) return [];
    const byEmail = identifier.includes('@');
    const phoneTail = identifier.replace(/\D/g, '').slice(-9);
    if (!byEmail && phoneTail.length < 9) return [];

    const [userIds, teacherIds, studentIds] = byEmail
      ? [[], [], []]
      : await Promise.all([
          this.prisma.$queryRaw<
            { id: number }[]
          >`SELECT id FROM "User" WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = ${phoneTail}`,
          this.prisma.$queryRaw<
            { id: number }[]
          >`SELECT id FROM "Teacher" WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = ${phoneTail}`,
          this.prisma.$queryRaw<
            { id: number }[]
          >`SELECT id FROM "Student" WHERE right(regexp_replace(phone, '\\D', '', 'g'), 9) = ${phoneTail}`,
        ]);
    const where = (ids: { id: number }[]) =>
      byEmail
        ? { email: { equals: identifier, mode: 'insensitive' as const } }
        : { id: { in: ids.map((row) => row.id) } };

    const [users, teachers, students] = await Promise.all([
      this.prisma.user.findMany({ where: where(userIds) }),
      this.prisma.teacher.findMany({ where: where(teacherIds) }),
      this.prisma.student.findMany({ where: where(studentIds) }),
    ]);

    return [
      ...users.map((user) => ({
        id: user.id,
        password: user.password,
        status: user.status,
        archived: false,
        role: user.role as Role,
        type: 'user' as AccountType,
      })),
      ...teachers.map((teacher) => ({
        id: teacher.id,
        password: teacher.password,
        status: teacher.status,
        archived: Boolean(teacher.archived_at),
        role: Role.TEACHER,
        type: 'teacher' as AccountType,
      })),
      ...students.map((student) => ({
        id: student.id,
        password: student.password,
        status: student.status,
        archived: Boolean(student.archived_at),
        role: Role.STUDENT,
        type: 'student' as AccountType,
      })),
    ];
  }
}
