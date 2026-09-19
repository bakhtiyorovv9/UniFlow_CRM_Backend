import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../core/database/prisma.service.js';

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LESSON_MINUTES = 90;
export const HOMEWORK_WINDOW_MS = 24 * 60 * 60 * 1000;

export function homeworkDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + HOMEWORK_WINDOW_MS);
}

const JS_DAY: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Ch',
  THURSDAY: 'Pa',
  FRIDAY: 'Ju',
  SATURDAY: 'Sh',
  SUNDAY: 'Ya',
};

export function tashkentDayRange(date: Date) {
  const local = new Date(date.getTime() + TASHKENT_OFFSET_MS);
  const start = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
      TASHKENT_OFFSET_MS,
  );
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

export async function ensureGroupOpen(prisma: PrismaService, groupId: number) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { name: true, status: true },
  });
  if (!group) throw new NotFoundException('Guruh topilmadi');
  if (group.status === 'completed' || group.status === 'inactive') {
    throw new BadRequestException(
      `"${group.name}" guruhi ${group.status === 'completed' ? 'yakunlangan' : 'nofaol'}. Yangi dars, davomat yoki vazifa qo'shib bo'lmaydi`,
    );
  }
}

export type ScheduleInput = {
  id?: number;
  name: string;
  start_date: Date;
  start_time: string;
  week_day: string[];
  courses: { duration_hours: number; duration_month: number };
};

type Window = {
  days: Set<number>;
  from: number;
  to: number;
  startMin: number;
  endMin: number;
};

function addMonthsUtc(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function formatMinutes(total: number) {
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function scheduleWindow(group: ScheduleInput): Window {
  const days = new Set(group.week_day.map((day) => JS_DAY[day]));
  const from = Date.UTC(
    group.start_date.getUTCFullYear(),
    group.start_date.getUTCMonth(),
    group.start_date.getUTCDate(),
  );
  const to = addMonthsUtc(
    new Date(from),
    Math.max(1, group.courses.duration_month),
  ).getTime();

  let lessons = 0;
  for (let cursor = from; cursor < to; cursor += DAY_MS) {
    if (days.has(new Date(cursor).getUTCDay())) lessons++;
  }
  let minutes = DEFAULT_LESSON_MINUTES;
  if (lessons > 0 && group.courses.duration_hours > 0) {
    const perLesson =
      Math.round((group.courses.duration_hours * 60) / lessons / 15) * 15;
    if (perLesson > 0 && perLesson <= 8 * 60) minutes = perLesson;
  }
  const startMin = toMinutes(group.start_time);
  return { days, from, to, startMin, endMin: startMin + minutes };
}

export function describeSchedule(group: ScheduleInput) {
  const window = scheduleWindow(group);
  const days = group.week_day.map((day) => DAY_SHORT[day] ?? day).join(', ');
  return `${days} ${formatMinutes(window.startMin)}–${formatMinutes(window.endMin)}`;
}

export function schedulesOverlap(a: ScheduleInput, b: ScheduleInput) {
  const first = scheduleWindow(a);
  const second = scheduleWindow(b);
  const sharesDay = [...first.days].some((day) => second.days.has(day));
  const datesOverlap = first.from < second.to && second.from < first.to;
  const timesOverlap =
    first.startMin < second.endMin && second.startMin < first.endMin;
  return sharesDay && datesOverlap && timesOverlap;
}

export async function ensureTeacherFree(
  prisma: PrismaService,
  teacherId: number,
  group: ScheduleInput,
) {
  const links = await prisma.groupTeacher.findMany({
    where: {
      teacher_id: teacherId,
      status: 'active',
      ...(group.id && { group_id: { not: group.id } }),
      Group: { status: { in: ['active', 'planned'] } },
    },
    include: {
      Teacher: { select: { full_name: true } },
      Group: { include: { courses: true } },
    },
  });
  const clash = links.find((link) => schedulesOverlap(group, link.Group));
  if (clash) {
    throw new BadRequestException(
      `O'qituvchi "${clash.Teacher.full_name}" shu vaqtda "${clash.Group.name}" guruhida dars beradi (${describeSchedule(clash.Group)})`,
    );
  }
}
