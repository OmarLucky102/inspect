import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export const BCRYPT_ROUNDS = 12;

@Injectable()
export class BcryptHasherService {
  async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, BCRYPT_ROUNDS);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
