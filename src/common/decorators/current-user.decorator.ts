import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/jwt-payload.type.js';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
    return field ? user?.[field] : user;
  },
);
