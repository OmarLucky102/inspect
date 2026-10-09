import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  findByBankIdAndPhone(bankId: string, phone: string): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  update(customer: Customer): Promise<void>;
}
