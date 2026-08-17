import { Role as PrismaRole } from '../../../../generated/prisma';
import { Role as DomainRole } from '../../domain/value-objects/role.enum';

const PRISMA_TO_DOMAIN_ROLE: Partial<Record<PrismaRole, DomainRole>> = {
  [PrismaRole.SUPER_ADMIN]: DomainRole.SUPER_ADMIN,
  [PrismaRole.MANAGER]: DomainRole.MANAGER,
  [PrismaRole.REVIEWER]: DomainRole.REVIEWER,
  [PrismaRole.USER]: DomainRole.USER,
};

const DOMAIN_TO_PRISMA_ROLE: Partial<Record<DomainRole, PrismaRole>> = {
  [DomainRole.SUPER_ADMIN]: PrismaRole.SUPER_ADMIN,
  [DomainRole.MANAGER]: PrismaRole.MANAGER,
  [DomainRole.REVIEWER]: PrismaRole.REVIEWER,
  [DomainRole.USER]: PrismaRole.USER,
};

export class RoleMapper {
  static toDomain(prismaRole: PrismaRole): DomainRole {
    const domainRole = PRISMA_TO_DOMAIN_ROLE[prismaRole];
    if (!domainRole) {
      throw new Error(`Unhandled Prisma Role mapping: ${prismaRole}. This role exists in the database but not in the domain.`);
    }
    return domainRole;
  }

  static toPrisma(domainRole: DomainRole): PrismaRole {
    const prismaRole = DOMAIN_TO_PRISMA_ROLE[domainRole];
    if (!prismaRole) {
      throw new Error(
        `Domain Role '${domainRole}' cannot be mapped to Prisma Role. It might be missing in the Prisma schema.`
      );
    }
    return prismaRole;
  }
}
