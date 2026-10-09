import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { IdentityModule } from './identity/identity.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from './config/config.module';
import { OrganizationModule } from './organization/organization.module';
import { InspectionModule } from './inspection/inspection.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SharedModule,
    IdentityModule,
    HealthModule,
    OrganizationModule,
    InspectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
