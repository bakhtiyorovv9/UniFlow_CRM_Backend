import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payments.dto.js';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
