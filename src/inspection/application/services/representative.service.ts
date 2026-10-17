import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRepresentativeDto } from '../../presentation/dto/create-representative.dto';
import { UpdateRepresentativeDto } from '../../presentation/dto/update-representative.dto';

const GOV_ABBREVIATIONS: Record<string, string> = {
  Cairo: 'CAI',
  Giza: 'GIZ',
  Alexandria: 'ALX',
  Dakahlia: 'DKH',
  'Red Sea': 'RDS',
  Beheira: 'BEH',
  Fayoum: 'FAY',
  Gharbiya: 'GHB',
  Ismailia: 'ISM',
  Menofia: 'MNF',
  Minya: 'MIN',
  Qaliubiya: 'QLB',
  'New Valley': 'NVL',
  Suez: 'SUZ',
  Aswan: 'ASW',
  Assiut: 'AST',
  'Beni Suef': 'BNS',
  'Port Said': 'PSD',
  Damietta: 'DAM',
  Sharkia: 'SHR',
  'South Sinai': 'SSH',
  'Kafr Al Sheikh': 'KFS',
  Matrouh: 'MAT',
  Luxor: 'LXR',
  Qena: 'QNA',
  'North Sinai': 'NSH',
  Sohag: 'SHG',
};

const REPRESENTATIVE_DEFAULT_INCLUDES = {
  governorate: {
    select: {
      id: true,
      code: true,
      name: true,
      nameAr: true,
    },
  },
  city: {
    select: {
      id: true,
      name: true,
      nameAr: true,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
    },
  },
};

@Injectable()
export class RepresentativeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Auto-generate sequential ID with optional region prefix ────────────────
  // e.g., REP-CAI-001 (if Cairo selected), or REP-001 (standard sequential)
  async generateNextRepresentativeId(governorateId?: string): Promise<string> {
    let prefix = 'REP';

    if (governorateId) {
      const gov = await this.prisma.governorate.findUnique({
        where: { id: governorateId },
      });
      if (gov) {
        const abbr =
          GOV_ABBREVIATIONS[gov.name] ||
          (gov.code ? `G${gov.code}` : gov.name.slice(0, 3).toUpperCase());
        prefix = `REP-${abbr}`;
      }
    }

    const reps = await this.prisma.representative.findMany({
      where: {
        representativeId: { startsWith: prefix, mode: 'insensitive' },
      },
      select: { representativeId: true },
    });

    let maxNumber = 0;
    // Match trailing digits: e.g. REP-CAI-001 -> 1, REP-002 -> 2
    const regex = new RegExp(`^${prefix}[-_]?0*(\\d+)$`, 'i');

    for (const r of reps) {
      const match = regex.exec(r.representativeId.trim());
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  }

  // ─── Overview Stats ────────────────────────────────────────────────────────
  async getOverview() {
    const [total, active, inactive, distinctGovs] = await Promise.all([
      this.prisma.representative.count(),
      this.prisma.representative.count({ where: { isActive: true } }),
      this.prisma.representative.count({ where: { isActive: false } }),
      this.prisma.representative.findMany({
        where: { governorateId: { not: null } },
        distinct: ['governorateId'],
        select: { governorateId: true },
      }),
    ]);

    return {
      total,
      active,
      inactive,
      locationsCount: distinctGovs.length,
    };
  }

  // ─── List / Search Representatives ─────────────────────────────────────────
  async findAll(filter?: {
    search?: string;
    isActive?: boolean;
    governorateId?: string;
    cityId?: string;
    locationName?: string;
  }) {
    const where: any = {};

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.governorateId) {
      where.governorateId = filter.governorateId;
    }

    if (filter?.cityId) {
      where.cityId = filter.cityId;
    }

    if (filter?.locationName) {
      where.locationName = filter.locationName;
    }

    if (filter?.search) {
      const s = filter.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { representativeId: { contains: s, mode: 'insensitive' } },
        { branchName: { contains: s, mode: 'insensitive' } },
        { locationName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { governorate: { name: { contains: s, mode: 'insensitive' } } },
        { governorate: { nameAr: { contains: s, mode: 'insensitive' } } },
        { city: { name: { contains: s, mode: 'insensitive' } } },
        { city: { nameAr: { contains: s, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.representative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: REPRESENTATIVE_DEFAULT_INCLUDES,
    });
  }

  // ─── Find By ID ───────────────────────────────────────────────────────────
  async findById(id: string) {
    const rep = await this.prisma.representative.findUnique({
      where: { id },
      include: REPRESENTATIVE_DEFAULT_INCLUDES,
    });

    if (!rep) {
      throw new NotFoundException(
        `Representative with ID "${id}" was not found.`,
      );
    }

    return rep;
  }

  // ─── Create Representative ────────────────────────────────────────────────
  async create(dto: CreateRepresentativeDto) {
    const cleanName = dto.name.trim();

    // Auto-generate code if omitted or blank
    let cleanCode = dto.representativeId?.trim().toUpperCase();
    if (!cleanCode) {
      cleanCode = await this.generateNextRepresentativeId(dto.governorateId);
    }

    // Verify representativeId uniqueness
    const existingCode = await this.prisma.representative.findFirst({
      where: {
        representativeId: { equals: cleanCode, mode: 'insensitive' },
      },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Representative code "${cleanCode}" is already in use.`,
      );
    }

    // If email provided, check uniqueness
    const cleanEmail = dto.email?.trim().toLowerCase() || null;
    if (cleanEmail) {
      const existingEmail = await this.prisma.representative.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      });
      if (existingEmail) {
        throw new BadRequestException(
          `Representative with email "${cleanEmail}" already exists.`,
        );
      }
    }

    // Validate optional governorate
    let govName = '';
    if (dto.governorateId) {
      const gov = await this.prisma.governorate.findUnique({
        where: { id: dto.governorateId },
      });
      if (!gov) {
        throw new NotFoundException(
          `Governorate with ID "${dto.governorateId}" was not found.`,
        );
      }
      govName = gov.name;
    }

    // Validate optional city
    let cityName = '';
    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: dto.cityId },
      });
      if (!city) {
        throw new NotFoundException(
          `City with ID "${dto.cityId}" was not found.`,
        );
      }
      if (dto.governorateId && city.governorateId !== dto.governorateId) {
        throw new BadRequestException(
          `Selected city does not belong to the selected governorate.`,
        );
      }
      cityName = city.name;
    }

    // Validate optional userId
    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException(
          `User account with ID "${dto.userId}" was not found.`,
        );
      }

      const existingLinkedRep = await this.prisma.representative.findUnique({
        where: { userId: dto.userId },
      });
      if (existingLinkedRep) {
        throw new BadRequestException(
          `User account is already linked to representative "${existingLinkedRep.name}".`,
        );
      }
    }

    // Construct unified locationName for display compatibility
    const cleanBranch = dto.branchName?.trim() || null;
    let computedLocationName = dto.locationName?.trim() || null;
    if (!computedLocationName) {
      const parts = [cleanBranch, cityName, govName].filter(Boolean);
      computedLocationName = parts.length > 0 ? parts.join(' - ') : null;
    }

    return this.prisma.representative.create({
      data: {
        representativeId: cleanCode,
        name: cleanName,
        governorateId: dto.governorateId || null,
        cityId: dto.cityId || null,
        branchName: cleanBranch,
        locationName: computedLocationName,
        phone: dto.phone?.trim() || null,
        email: cleanEmail,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        userId: dto.userId || null,
      },
      include: REPRESENTATIVE_DEFAULT_INCLUDES,
    });
  }

  // ─── Update Representative ────────────────────────────────────────────────
  async update(id: string, dto: UpdateRepresentativeDto) {
    const rep = await this.findById(id);

    const data: any = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException('Representative name cannot be empty.');
      }
      data.name = cleanName;
    }

    if (dto.representativeId !== undefined) {
      const cleanCode = dto.representativeId.trim().toUpperCase();
      if (!cleanCode) {
        throw new BadRequestException('Representative code cannot be empty.');
      }
      const existing = await this.prisma.representative.findFirst({
        where: {
          representativeId: { equals: cleanCode, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Representative code "${cleanCode}" is already in use.`,
        );
      }
      data.representativeId = cleanCode;
    }

    let govName = rep.governorate?.name || '';
    if (dto.governorateId !== undefined) {
      if (dto.governorateId === null) {
        data.governorateId = null;
        govName = '';
      } else {
        const gov = await this.prisma.governorate.findUnique({
          where: { id: dto.governorateId },
        });
        if (!gov) {
          throw new NotFoundException(
            `Governorate with ID "${dto.governorateId}" was not found.`,
          );
        }
        data.governorateId = dto.governorateId;
        govName = gov.name;
      }
    }

    let cityName = rep.city?.name || '';
    if (dto.cityId !== undefined) {
      if (dto.cityId === null) {
        data.cityId = null;
        cityName = '';
      } else {
        const city = await this.prisma.city.findUnique({
          where: { id: dto.cityId },
        });
        if (!city) {
          throw new NotFoundException(
            `City with ID "${dto.cityId}" was not found.`,
          );
        }
        const effectiveGovId =
          dto.governorateId !== undefined
            ? dto.governorateId
            : rep.governorateId;
        if (effectiveGovId && city.governorateId !== effectiveGovId) {
          throw new BadRequestException(
            `Selected city does not belong to the selected governorate.`,
          );
        }
        data.cityId = dto.cityId;
        cityName = city.name;
      }
    }

    let branchName = rep.branchName || '';
    if (dto.branchName !== undefined) {
      data.branchName = dto.branchName?.trim() || null;
      branchName = data.branchName || '';
    }

    if (dto.locationName !== undefined) {
      data.locationName = dto.locationName?.trim() || null;
    } else if (
      dto.governorateId !== undefined ||
      dto.cityId !== undefined ||
      dto.branchName !== undefined
    ) {
      const parts = [branchName, cityName, govName].filter(Boolean);
      data.locationName = parts.length > 0 ? parts.join(' - ') : null;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone?.trim() || null;
    }

    if (dto.email !== undefined) {
      const cleanEmail = dto.email?.trim().toLowerCase() || null;
      if (cleanEmail) {
        const existingEmail = await this.prisma.representative.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' },
            NOT: { id },
          },
        });
        if (existingEmail) {
          throw new BadRequestException(
            `Representative with email "${cleanEmail}" already exists.`,
          );
        }
      }
      data.email = cleanEmail;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (dto.userId !== undefined) {
      if (dto.userId === null) {
        data.userId = null;
      } else {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.userId },
        });
        if (!user) {
          throw new NotFoundException(
            `User account with ID "${dto.userId}" was not found.`,
          );
        }
        const existingLinkedRep = await this.prisma.representative.findFirst({
          where: { userId: dto.userId, NOT: { id } },
        });
        if (existingLinkedRep) {
          throw new BadRequestException(
            `User account is already linked to another representative ("${existingLinkedRep.name}").`,
          );
        }
        data.userId = dto.userId;
      }
    }

    return this.prisma.representative.update({
      where: { id },
      data,
      include: REPRESENTATIVE_DEFAULT_INCLUDES,
    });
  }

  // ─── Toggle Active Status ─────────────────────────────────────────────────
  async toggleStatus(id: string) {
    const rep = await this.findById(id);
    return this.prisma.representative.update({
      where: { id },
      data: { isActive: !rep.isActive },
      include: REPRESENTATIVE_DEFAULT_INCLUDES,
    });
  }

  // ─── Delete Representative ────────────────────────────────────────────────
  async delete(id: string) {
    await this.findById(id);
    return this.prisma.representative.delete({
      where: { id },
    });
  }
}
