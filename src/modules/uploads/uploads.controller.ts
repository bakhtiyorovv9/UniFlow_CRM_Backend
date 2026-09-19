import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';

const PHOTO_DIR = './uploads/photos';
const FILE_DIR = './uploads/files';
const FILE_EXT = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.zip',
  '.rar',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
];
const FILE_MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024;

mkdirSync(PHOTO_DIR, { recursive: true });
mkdirSync(FILE_DIR, { recursive: true });

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('photo')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Rasm yuklash (o'qituvchi yoki talaba uchun)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Rasm fayli (.jpg, .jpeg, .png, .webp), 5 MB gacha',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Rasm yuklandi, url qaytadi' })
  @ApiBadRequestResponse({ description: "Fayl formati yoki hajmi noto'g'ri" })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: PHOTO_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_SIZE },
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
  uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Rasm yuborilmadi');
    return { url: `/uploads/photos/${file.filename}` };
  }

  @Post('file')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: 'Uyga vazifa uchun fayl yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: `Fayl (${FILE_EXT.join(', ')}), 20 MB gacha`,
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Fayl yuklandi, url va nomi qaytadi' })
  @ApiBadRequestResponse({ description: "Fayl formati yoki hajmi noto'g'ri" })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: FILE_DIR,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: FILE_MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!FILE_EXT.includes(ext)) {
          return cb(
            new BadRequestException(
              `Faqat quyidagi formatlar: ${FILE_EXT.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Fayl yuborilmadi');
    return {
      url: `/uploads/files/${file.filename}`,
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
    };
  }
}
