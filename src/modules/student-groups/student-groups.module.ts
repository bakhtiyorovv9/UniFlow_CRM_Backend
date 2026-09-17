import { Module } from '@nestjs/common';
import { StudentGroupsController } from './student-groups.controller.js';
import { StudentGroupsService } from './student-groups.service.js';

@Module({
  controllers: [StudentGroupsController],
  providers: [StudentGroupsService],
})
export class StudentGroupsModule {}
