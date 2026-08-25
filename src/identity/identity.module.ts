import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure — Repositories
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';

// Infrastructure — Services
import { BcryptHasherService } from './infrastructure/services/bcrypt-hasher.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';

// Application — Services
import { UserService } from './application/services/user.service';
import { AuthService } from './application/services/auth.service';

// Presentation — Controllers
import { UserController } from './presentation/controllers/user.controller';
import { AuthController } from './presentation/controllers/auth.controller';

// Presentation — Guards
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, UserController],
  providers: [
    // Repository binding (interface token → concrete implementation)
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    // Application Services
    UserService,
    AuthService,
    // Infrastructure Services
    BcryptHasherService,
    JwtTokenService,
    // Guards (registered as providers so they can use DI)
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    UserService,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtTokenService,
    BcryptHasherService,
  ],
})
export class IdentityModule {}
