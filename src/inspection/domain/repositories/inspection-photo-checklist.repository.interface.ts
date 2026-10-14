import { InspectionPhotoChecklist } from '../entities/inspection-photo-checklist.entity';

export interface IInspectionPhotoChecklistRepository {
  findByRequestId(
    requestId: string,
  ): Promise<InspectionPhotoChecklist | null>;
  save(checklist: InspectionPhotoChecklist): Promise<void>;
  upsert(checklist: InspectionPhotoChecklist): Promise<void>;
}
