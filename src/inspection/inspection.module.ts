import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { OrganizationModule } from '../organization/organization.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { PrismaInspectionRequestRepository } from './infrastructure/repositories/prisma-inspection-request.repository';
import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository';
import { PrismaRequestNumberCounterRepository } from './infrastructure/repositories/prisma-request-number-counter.repository';
import { PrismaLocationRepository } from './infrastructure/repositories/prisma-location.repository';
import { PrismaVehicleReferenceRepository } from './infrastructure/repositories/prisma-vehicle-reference.repository';
import { PrismaChecklistRepository } from './infrastructure/repositories/prisma-checklist.repository';
import { PrismaChecklistItemRepository } from './infrastructure/repositories/prisma-checklist-item.repository';
import { PrismaInspectionChecklistItemRepository } from './infrastructure/repositories/prisma-inspection-checklist-item.repository';
import { InspectionRequestService } from './application/services/inspection-request.service';
import { ChecklistService } from './application/services/checklist.service';
import { InspectionRequestController } from './presentation/controllers/inspection-request.controller';
import { ChecklistController } from './presentation/controllers/checklist.controller';

@Module({
  imports: [IdentityModule, OrganizationModule, VehicleModule],
  controllers: [InspectionRequestController, ChecklistController],
  providers: [
    {
      provide: 'IInspectionRequestRepository',
      useClass: PrismaInspectionRequestRepository,
    },
    {
      provide: 'ICustomerRepository',
      useClass: PrismaCustomerRepository,
    },
    {
      provide: 'IRequestNumberCounterRepository',
      useClass: PrismaRequestNumberCounterRepository,
    },
    {
      provide: 'ILocationRepository',
      useClass: PrismaLocationRepository,
    },
    {
      provide: 'IVehicleReferenceRepository',
      useClass: PrismaVehicleReferenceRepository,
    },
    {
      provide: 'IChecklistRepository',
      useClass: PrismaChecklistRepository,
    },
    {
      provide: 'IChecklistItemRepository',
      useClass: PrismaChecklistItemRepository,
    },
    {
      provide: 'IInspectionChecklistItemRepository',
      useClass: PrismaInspectionChecklistItemRepository,
    },
    InspectionRequestService,
    ChecklistService,
  ],
})
export class InspectionModule {}
