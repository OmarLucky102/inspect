import {
  InspectionRequest as PrismaInspectionRequest,
  Prisma,
} from '@prisma/client';
import { InspectionRequest } from '../../domain/entities/inspection-request.entity';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';
import { InspectionPriority } from '../../domain/value-objects/inspection-priority.enum';

export class InspectionRequestMapper {
  static toDomain(prismaRequest: PrismaInspectionRequest): InspectionRequest {
    return new InspectionRequest({
      id: prismaRequest.id,
      requestNumber: prismaRequest.requestNumber,
      bankId: prismaRequest.bankId,
      vehicleId: prismaRequest.vehicleId,
      customerId: prismaRequest.customerId,
      assignedRepresentativeId: prismaRequest.assignedRepresentativeId,
      assignedReviewerId: prismaRequest.assignedReviewerId,
      currentStatus: prismaRequest.currentStatus as InspectionStatus,
      priority: prismaRequest.priority as InspectionPriority,
      governorateId: prismaRequest.governorateId,
      cityId: prismaRequest.cityId,
      latitude: prismaRequest.latitude
        ? prismaRequest.latitude.toNumber()
        : null,
      longitude: prismaRequest.longitude
        ? prismaRequest.longitude.toNumber()
        : null,
      address: prismaRequest.address,
      requestedCompletionDate: prismaRequest.requestedCompletionDate,
      requestedAt: prismaRequest.requestedAt,
      assignedAt: prismaRequest.assignedAt,
      completedAt: prismaRequest.completedAt,
      notes: prismaRequest.notes,
      createdBy: prismaRequest.createdBy,
      createdAt: prismaRequest.createdAt,
      updatedAt: prismaRequest.updatedAt,
    });
  }

  static toCreateData(
    request: InspectionRequest,
  ): Prisma.InspectionRequestCreateInput {
    return {
      id: request.id,
      requestNumber: request.requestNumber,
      currentStatus: request.currentStatus,
      priority: request.priority,
      latitude: request.latitude,
      longitude: request.longitude,
      address: request.address,
      requestedCompletionDate: request.requestedCompletionDate,
      requestedAt: request.requestedAt,
      assignedAt: request.assignedAt,
      completedAt: request.completedAt,
      notes: request.notes,
      bank: { connect: { id: request.bankId } },
      customer: { connect: { id: request.customerId } },
      creator: { connect: { id: request.createdBy } },
      ...(request.vehicleId
        ? { vehicle: { connect: { id: request.vehicleId } } }
        : {}),
      ...(request.governorateId
        ? { governorate: { connect: { id: request.governorateId } } }
        : {}),
      ...(request.cityId ? { city: { connect: { id: request.cityId } } } : {}),
      ...(request.assignedRepresentativeId
        ? {
            assignedRepresentative: {
              connect: { id: request.assignedRepresentativeId },
            },
          }
        : {}),
      ...(request.assignedReviewerId
        ? { assignedReviewer: { connect: { id: request.assignedReviewerId } } }
        : {}),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  static toUpdateData(
    request: InspectionRequest,
  ): Prisma.InspectionRequestUpdateInput {
    return {
      currentStatus: request.currentStatus,
      priority: request.priority,
      latitude: request.latitude,
      longitude: request.longitude,
      address: request.address,
      requestedCompletionDate: request.requestedCompletionDate,
      requestedAt: request.requestedAt,
      assignedAt: request.assignedAt,
      completedAt: request.completedAt,
      notes: request.notes,
      ...(request.vehicleId
        ? { vehicle: { connect: { id: request.vehicleId } } }
        : { vehicle: { disconnect: true } }),
      ...(request.governorateId
        ? { governorate: { connect: { id: request.governorateId } } }
        : { governorate: { disconnect: true } }),
      ...(request.cityId
        ? { city: { connect: { id: request.cityId } } }
        : { city: { disconnect: true } }),
      ...(request.assignedRepresentativeId
        ? {
            assignedRepresentative: {
              connect: { id: request.assignedRepresentativeId },
            },
          }
        : { assignedRepresentative: { disconnect: true } }),
      ...(request.assignedReviewerId
        ? { assignedReviewer: { connect: { id: request.assignedReviewerId } } }
        : { assignedReviewer: { disconnect: true } }),
      updatedAt: request.updatedAt,
    };
  }
}
