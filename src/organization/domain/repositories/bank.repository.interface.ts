import { Bank } from '../entities/bank.entity';

export interface IBankRepository {
  findById(id: string): Promise<Bank | null>;
  findByCode(code: string): Promise<Bank | null>;
  findAll(): Promise<Bank[]>;
  save(bank: Bank): Promise<void>;
  update(bank: Bank): Promise<void>;
}
