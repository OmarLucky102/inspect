import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { PrismaService } from '../../../database/prisma.service';
import { UserMapper } from '../persistence/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { id } });
    if (!prismaUser) return null;
    return UserMapper.toDomain(prismaUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { email } });
    if (!prismaUser) return null;
    return UserMapper.toDomain(prismaUser);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toCreateData(user);
    await this.prisma.user.create({ data });
  }

  async update(user: User): Promise<void> {
    const data = UserMapper.toUpdateData(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data,
    });
  }
  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
