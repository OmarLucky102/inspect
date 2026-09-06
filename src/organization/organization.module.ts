import { Module } from '@nestjs/common';

// Infrastructure — Repositories
import { PrismaBankRepository } from './infrastructure/repositories/prisma-bank.repository';
import { PrismaBankMembershipRepository } from './infrastructure/repositories/prisma-bank-membership.repository';

// Application — Services
import { BankService } from './application/services/bank.service';

// Presentation — Controllers
import { BankController } from './presentation/controllers/bank.controller';

// Identity Module (for guards, user repo, bcrypt)
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule], // Provides: JwtAuthGuard, RolesGuard, BcryptHasherService, IUserRepository (exported)
  controllers: [BankController],
  providers: [
    {
      provide: 'IBankRepository',
      useClass: PrismaBankRepository,
    },
    {
      provide: 'IBankMembershipRepository',
      useClass: PrismaBankMembershipRepository,
    },
    BankService,
  ],
})
export class OrganizationModule {}
