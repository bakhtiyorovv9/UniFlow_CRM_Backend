import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service.js';

export async function ensureTeacherInGroup(
  prisma: PrismaService,
  teacherId: number,
  groupId: number,
): Promise<void> {
  const link = await prisma.groupTeacher.findFirst({
    where: {
      teacher_id: teacherId,
      group_id: groupId,
      status: 'active',
    },
  });
  if (!link) {
    throw new ForbiddenException("Siz bu guruhning o'qituvchisi emassiz");
  }
}
