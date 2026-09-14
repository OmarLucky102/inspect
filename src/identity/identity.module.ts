import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

// Infrastructure — Repositories
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';

// Infrastructure — Services
import { BcryptHasherService } from './infrastructure/services/bcrypt-hasher.service';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { TokenHasherService } from './infrastructure/services/token-hasher.service';

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
    // Repository bindings
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useClass: PrismaRefreshTokenRepository,
    },
    // Application Services
    UserService,
    AuthService,
    // Infrastructure Services
    BcryptHasherService,
    JwtTokenService,
    TokenHasherService,
    // Guards
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
    TokenHasherService,
  ],
})
export class IdentityModule {}
