import { Module } from '@nestjs/common';
import { GroupTeachersController } from './group-teachers.controller.js';
import { GroupTeachersService } from './group-teachers.service.js';

@Module({
  controllers: [GroupTeachersController],
  providers: [GroupTeachersService],
})
export class GroupTeachersModule {}
