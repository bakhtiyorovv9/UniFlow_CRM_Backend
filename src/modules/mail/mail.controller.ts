import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/index.js';
import { Role } from '../../common/enums/index.js';
import { MailService } from './mail.service.js';

@ApiTags('mail')
@Controller('mail')
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('status')
  @ApiOperation({ summary: 'SMTP (email) ulanish holati' })
  @ApiOkResponse({ description: 'Holat' })
  status() {
    return this.mailService.status();
  }
}
