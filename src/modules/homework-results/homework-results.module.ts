import { Module } from '@nestjs/common';
import { HomeworkResultsController } from './homework-results.controller.js';
import { HomeworkResultsService } from './homework-results.service.js';

@Module({
  controllers: [HomeworkResultsController],
  providers: [HomeworkResultsService],
})
export class HomeworkResultsModule {}
