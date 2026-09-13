import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class TokenHasherService {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
