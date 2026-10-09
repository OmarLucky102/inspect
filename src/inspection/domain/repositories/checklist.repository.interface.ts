import { Checklist } from '../entities/checklist.entity';

export interface IChecklistRepository {
  findByCode(code: string): Promise<Checklist | null>;
  findByCategoryId(categoryId: string): Promise<Checklist[]>;
  findById(id: string): Promise<Checklist | null>;
}
