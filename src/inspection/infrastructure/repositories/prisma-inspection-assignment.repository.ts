import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IInspectionAssignmentRepository } from '../../domain/repositories/inspection-assignment.repository.interface';
import { InspectionAssignment } from '../../domain/entities/inspection-assignment.entity';
import { InspectionAssignmentMapper } from '../persistence/inspection-assignment.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInspectionAssignmentRepository implements IInspectionAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    assignment: InspectionAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionAssignment.create({
      data: InspectionAssignmentMapper.toCreateData(assignment),
    });
  }

  async update(
    assignment: InspectionAssignment,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionAssignment.update({
      where: { id: assignment.id },
      data: InspectionAssignmentMapper.toUpdateData(assignment),
    });
  }

  async findById(id: string): Promise<InspectionAssignment | null> {
    const row = await this.prisma.inspectionAssignment.findUnique({
      where: { id },
    });
    return row ? InspectionAssignmentMapper.toDomain(row) : null;
  }

  async findActiveByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<InspectionAssignment | null> {
    const db = tx || this.prisma;
    const row = await db.inspectionAssignment.findFirst({
      where: {
        inspectionRequestId: requestId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return row ? InspectionAssignmentMapper.toDomain(row) : null;
  }

  async findByRequestId(requestId: string): Promise<InspectionAssignment[]> {
    const rows = await this.prisma.inspectionAssignment.findMany({
      where: { inspectionRequestId: requestId },
      orderBy: { assignedAt: 'desc' },
    });
    return rows.map((r) => InspectionAssignmentMapper.toDomain(r));
  }

  async cancelActiveByRequestId(
    requestId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx || this.prisma;
    await db.inspectionAssignment.updateMany({
      where: {
        inspectionRequestId: requestId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
