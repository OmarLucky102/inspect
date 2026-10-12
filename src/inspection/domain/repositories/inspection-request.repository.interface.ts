import { InspectionRequest } from '../entities/inspection-request.entity';
import { Prisma } from '@prisma/client';
import { InspectionRequestWithRelations } from '../../presentation/dto/inspection-request-detail.response.dto';

export interface IInspectionRequestRepository {
  findById(id: string): Promise<InspectionRequest | null>;
  findByIdAndBankId(
    id: string,
    bankId: string,
  ): Promise<InspectionRequest | null>;
  findByBankId(bankId: string): Promise<InspectionRequest[]>;
  findByIdWithDetails(
    id: string,
    bankId?: string,
  ): Promise<InspectionRequestWithRelations | null>;
  save(
    request: InspectionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  update(
    request: InspectionRequest,
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
  findOpenByBankAndVehicleId(
    bankId: string,
    vehicleId: string,
  ): Promise<InspectionRequest[]>;
}
