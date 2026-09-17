import { Module } from '@nestjs/common';
import { HomeworksController } from './homeworks.controller.js';
import { HomeworksService } from './homeworks.service.js';

@Module({
  controllers: [HomeworksController],
  providers: [HomeworksService],
})
export class HomeworksModule {}
