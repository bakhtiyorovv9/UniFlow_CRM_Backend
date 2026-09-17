import { Module } from '@nestjs/common';
import { LessonVideosController } from './lesson-videos.controller.js';
import { LessonVideosService } from './lesson-videos.service.js';

@Module({
  controllers: [LessonVideosController],
  providers: [LessonVideosService],
})
export class LessonVideosModule {}
