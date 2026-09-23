import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { CurrentUser, Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { CreateLessonVideoDto } from './dto/create-lesson-videos.dto.js';
import { LessonVideosService } from './lesson-videos.service.js';

const ALLOWED_EXT = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lesson_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  group_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

@ApiTags('lesson-videos')
@Controller('lesson-videos')
export class LessonVideosController {
  constructor(private readonly lessonVideosService: LessonVideosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Dars videosini yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lesson_id', 'file'],
      properties: {
        lesson_id: {
          type: 'integer',
          example: 1,
          description: 'Dars id',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Video fayl (.mp4, .mov, .avi, .webm, .mkv)',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Video yuklandi' })
  @ApiForbiddenResponse({ description: "Siz bu guruh o'qituvchisi emassiz" })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          return cb(
            new BadRequestException(
              `Faqat quyidagi formatlar: ${ALLOWED_EXT.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateLessonVideoDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonVideosService.create(dto.lesson_id, file, user);
  }

  @Get()
  @ApiOperation({
    summary:
      "Videolar ro'yxati (ADMIN — hammasi, TEACHER va STUDENT — o'z guruhlari)",
  })
  @ApiOkResponse({ description: "Ro'yxat" })
  findAll(@Query() query: ListQueryDto, @CurrentUser() user: AuthUser) {
    return this.lessonVideosService.findAll(
      user,
      query.lesson_id,
      query.group_id,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta video maʼlumoti' })
  @ApiOkResponse({ description: 'Video' })
  @ApiNotFoundResponse({ description: 'Topilmadi' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lessonVideosService.findOne(id, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  @ApiOperation({ summary: "Videoni o'chirish (bazadan va diskdan)" })
  @ApiOkResponse({ description: "O'chirildi" })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.lessonVideosService.remove(id, user);
  }
}
