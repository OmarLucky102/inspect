import { InspectionRequest } from '../entities/inspection-request.entity';
import { Prisma } from '@prisma/client';

export interface IInspectionRequestRepository {
  findByIdAndBankId(
    id: string,
    bankId: string,
  ): Promise<InspectionRequest | null>;
  findByBankId(bankId: string): Promise<InspectionRequest[]>;
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
