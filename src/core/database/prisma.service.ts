import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
