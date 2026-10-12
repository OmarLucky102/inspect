import {
  InspectionAssignment as PrismaInspectionAssignment,
  Prisma,
} from '@prisma/client';
import { InspectionAssignment } from '../../domain/entities/inspection-assignment.entity';
import { AssignmentStatus } from '../../domain/value-objects/assignment-status.enum';

export class InspectionAssignmentMapper {
  static toDomain(
    prismaAssignment: PrismaInspectionAssignment,
  ): InspectionAssignment {
    return new InspectionAssignment({
      id: prismaAssignment.id,
      inspectionRequestId: prismaAssignment.inspectionRequestId,
      representativeId: prismaAssignment.representativeId,
      assignedBy: prismaAssignment.assignedBy,
      status: prismaAssignment.status as AssignmentStatus,
      rejectedReason: prismaAssignment.rejectedReason,
      assignedAt: prismaAssignment.assignedAt,
      acceptedAt: prismaAssignment.acceptedAt,
      rejectedAt: prismaAssignment.rejectedAt,
    });
  }

  static toCreateData(
    assignment: InspectionAssignment,
  ): Prisma.InspectionAssignmentCreateInput {
    return {
      id: assignment.id,
      status: assignment.status,
      rejectedReason: assignment.rejectedReason,
      assignedAt: assignment.assignedAt,
      acceptedAt: assignment.acceptedAt,
      rejectedAt: assignment.rejectedAt,
      inspectionRequest: {
        connect: { id: assignment.inspectionRequestId },
      },
      representative: {
        connect: { id: assignment.representativeId },
      },
      assigner: {
        connect: { id: assignment.assignedBy },
      },
    };
  }

  static toUpdateData(
    assignment: InspectionAssignment,
  ): Prisma.InspectionAssignmentUpdateInput {
    return {
      status: assignment.status,
      rejectedReason: assignment.rejectedReason,
      assignedAt: assignment.assignedAt,
      acceptedAt: assignment.acceptedAt,
      rejectedAt: assignment.rejectedAt,
    };
  }
}
