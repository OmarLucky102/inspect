import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';
import { VehicleLookupController } from './presentation/controllers/vehicle-lookup.controller';

@Module({
  imports: [IdentityModule],
  controllers: [VehicleLookupController],
  providers: [
    {
      provide: 'IVehicleRepository',
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: ['IVehicleRepository'],
})
export class VehicleModule {}
