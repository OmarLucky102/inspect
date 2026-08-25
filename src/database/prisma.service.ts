// 1. Add Logger to your existing imports at the very top
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log(
      '\n\x1b[1m\x1b[32m====================================================\x1b[0m',
    );
    console.log(
      '\x1b[1m\x1b[32m    DATABASE CONNECTED SUCCESSFULLY                 \x1b[0m',
    );
    console.log(
      '\x1b[1m\x1b[32m====================================================\x1b[0m\n',
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
