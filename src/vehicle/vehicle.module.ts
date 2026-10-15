import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';
import { VehicleLookupController } from './presentation/controllers/vehicle-lookup.controller';
import { VehicleAdminController } from './presentation/controllers/vehicle-admin.controller';
import { VehicleAdminService } from './application/services/vehicle-admin.service';

@Module({
  imports: [IdentityModule],
  controllers: [VehicleLookupController, VehicleAdminController],
  providers: [
    VehicleAdminService,
    {
      provide: 'IVehicleRepository',
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: ['IVehicleRepository', VehicleAdminService],
})
export class VehicleModule {}
