import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, Public } from '../../common/decorators/index.js';
import type { AuthUser } from '../../common/types/jwt-payload.type.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { TokensResponseDto } from './dto/tokens-response.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Tizimga kirish' })
  @ApiOkResponse({ description: 'Tokenlar qaytdi', type: TokensResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email yoki parol notoʻgʻri' })
  @ApiForbiddenResponse({ description: 'Akkaunt faol emas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Tokenlarni yangilash' })
  @ApiOkResponse({
    description: 'Yangi tokenlar qaytdi',
    type: TokensResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token yaroqsiz' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get('me')
  @ApiOperation({ summary: 'Joriy foydalanuvchi maʼlumotlari' })
  @ApiOkResponse({ description: 'Foydalanuvchi maʼlumotlari (parolsiz)' })
  @ApiUnauthorizedResponse({ description: 'Token yoʻq yoki yaroqsiz' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
