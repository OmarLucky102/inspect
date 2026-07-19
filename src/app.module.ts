import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { IdentityModule } from './identity/identity.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [SharedModule, IdentityModule, ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
