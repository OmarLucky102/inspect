import { ChecklistItem } from '../entities/checklist-item.entity';

export interface IChecklistItemRepository {
  findById(id: string): Promise<ChecklistItem | null>;
  findByChecklistId(checklistId: string): Promise<ChecklistItem[]>;
  findMandatoryItems(): Promise<ChecklistItem[]>;
  save(item: ChecklistItem): Promise<void>;
  update(item: ChecklistItem): Promise<void>;
}
