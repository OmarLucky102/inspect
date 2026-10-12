import { InspectionAssignment } from '../entities/inspection-assignment.entity';
import { Prisma } from '@prisma/client';

export interface IInspectionAssignmentRepository {
  save(
    assignment: InspectionAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  update(
    assignment: InspectionAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  findById(id: string): Promise<InspectionAssignment | null>;
  findActiveByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<InspectionAssignment | null>;
  findByRequestId(requestId: string): Promise<InspectionAssignment[]>;
  cancelActiveByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
