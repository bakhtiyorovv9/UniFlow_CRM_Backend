import type { Role } from '../enums/index.js';

export type AccountType = 'user' | 'teacher' | 'student';

export type JwtPayload = {
  sub: number;
  role: Role;
  type: AccountType;
};

export type AuthUser = {
  id: number;
  role: Role;
  type: AccountType;
};