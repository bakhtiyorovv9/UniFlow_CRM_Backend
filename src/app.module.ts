import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard, RolesGuard } from './common/guards/index.js';
import { PrismaModule } from './core/database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { TeachersModule } from './modules/teachers/teachers.module.js';
import { StudentsModule } from './modules/students/students.module.js';
import { GroupsModule } from './modules/groups/groups.module.js';
import { StudentGroupsModule } from './modules/student-groups/student-groups.module.js';
import { GroupTeachersModule } from './modules/group-teachers/group-teachers.module.js';
import { LessonsModule } from './modules/lessons/lessons.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { HomeworksModule } from './modules/homeworks/homeworks.module.js';
import { HomeworkAnswersModule } from './modules/homework-answers/homework-answers.module.js';
import { HomeworkResultsModule } from './modules/homework-results/homework-results.module.js';
import { LessonVideosModule } from './modules/lesson-videos/lesson-videos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RoomsModule,
    UsersModule,
    CoursesModule,
    TeachersModule,
    StudentsModule,
    GroupsModule,
    StudentGroupsModule,
    GroupTeachersModule,
    LessonsModule,
    AttendanceModule,
    HomeworksModule,
    HomeworkAnswersModule,
    HomeworkResultsModule,
    LessonVideosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
