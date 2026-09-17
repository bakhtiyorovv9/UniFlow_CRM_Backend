import { Module } from '@nestjs/common';
import { HomeworkAnswersController } from './homework-answers.controller.js';
import { HomeworkAnswersService } from './homework-answers.service.js';

@Module({
  controllers: [HomeworkAnswersController],
  providers: [HomeworkAnswersService],
})
export class HomeworkAnswersModule {}
