import { Module } from '@nestjs/common';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';

@Module({
  providers: [
    {
      provide: 'IVehicleRepository',
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: ['IVehicleRepository'],
})
export class VehicleModule {}
