import { Module } from '@nestjs/common';

// Infrastructure — Repositories
import { PrismaBankRepository } from './infrastructure/repositories/prisma-bank.repository';
import { PrismaBankMembershipRepository } from './infrastructure/repositories/prisma-bank-membership.repository';

// Application — Services
import { BankService } from './application/services/bank.service';

// Presentation — Controllers
import { BankController } from './presentation/controllers/bank.controller';

// Identity Module (for guards, UserService)
import { IdentityModule } from '../identity/identity.module';

// Presentation — Guards
import { BankMembershipGuard } from './presentation/guards/bank-membership.guard';

@Module({
  imports: [IdentityModule], // Provides: JwtAuthGuard, RolesGuard, UserService
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
    BankMembershipGuard,
  ],
  exports: [BankService, BankMembershipGuard],
})
export class OrganizationModule {}
