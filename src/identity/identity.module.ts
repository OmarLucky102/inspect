import { Module } from '@nestjs/common';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository'; // Update path if needed
import { UserService } from './application/services/user.service'; // Update path if needed

@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    UserService,
  ],
})
export class IdentityModule {}
