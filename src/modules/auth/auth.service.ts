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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const account = await this.findAccount(dto.email);
    const passwordOk = account
      ? await bcrypt.compare(dto.password, account.password)
      : false;

    if (!account || !passwordOk) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }
    if (account.status !== 'active') {
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

  private async findAccount(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      return {
        id: user.id,
        password: user.password,
        status: user.status,
        role: user.role as Role,
        type: 'user' as AccountType,
      };
    }

    const teacher = await this.prisma.teacher.findUnique({ where: { email } });
    if (teacher) {
      return {
        id: teacher.id,
        password: teacher.password,
        status: teacher.status,
        role: Role.TEACHER,
        type: 'teacher' as AccountType,
      };
    }

    const student = await this.prisma.student.findUnique({ where: { email } });
    if (student) {
      return {
        id: student.id,
        password: student.password,
        status: student.status,
        role: Role.STUDENT,
        type: 'student' as AccountType,
      };
    }

    return null;
  }
}