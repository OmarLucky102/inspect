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
import { PrismaInspectionStatusHistoryRepository } from './infrastructure/repositories/prisma-inspection-status-history.repository';
import { PrismaInspectionAssignmentRepository } from './infrastructure/repositories/prisma-inspection-assignment.repository';
import { PrismaInspectionPhotoChecklistRepository } from './infrastructure/repositories/prisma-inspection-photo-checklist.repository';
import { PrismaMarketingValueDecisionRepository } from './infrastructure/repositories/prisma-marketing-value-decision.repository';
import { InspectionRequestService } from './application/services/inspection-request.service';
import { ChecklistService } from './application/services/checklist.service';
import { InspectionRequestController } from './presentation/controllers/inspection-request.controller';
import { InspectionRequestStandaloneController } from './presentation/controllers/inspection-request-standalone.controller';
import { ChecklistController } from './presentation/controllers/checklist.controller';
import { LocationController } from './presentation/controllers/location.controller';
import { RepresentativeController } from './presentation/controllers/representative.controller';
import { RepresentativeService } from './application/services/representative.service';

@Module({
  imports: [IdentityModule, OrganizationModule, VehicleModule],
  controllers: [
    InspectionRequestController,
    InspectionRequestStandaloneController,
    ChecklistController,
    LocationController,
    RepresentativeController,
  ],
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
    {
      provide: 'IInspectionStatusHistoryRepository',
      useClass: PrismaInspectionStatusHistoryRepository,
    },
    {
      provide: 'IInspectionAssignmentRepository',
      useClass: PrismaInspectionAssignmentRepository,
    },
    {
      provide: 'IInspectionPhotoChecklistRepository',
      useClass: PrismaInspectionPhotoChecklistRepository,
    },
    {
      provide: 'IMarketingValueDecisionRepository',
      useClass: PrismaMarketingValueDecisionRepository,
    },
    InspectionRequestService,
    ChecklistService,
    RepresentativeService,
  ],
  exports: [RepresentativeService],
})
export class InspectionModule {}
