import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateBrandDto } from '../../presentation/dto/create-brand.dto';
import { UpdateBrandDto } from '../../presentation/dto/update-brand.dto';
import { CreateModelDto } from '../../presentation/dto/create-model.dto';
import { UpdateModelDto } from '../../presentation/dto/update-model.dto';
import { CreateColorDto } from '../../presentation/dto/create-color.dto';
import { UpdateColorDto } from '../../presentation/dto/update-color.dto';
import { CreateTrimDto } from '../../presentation/dto/create-trim.dto';
import { UpdateTrimDto } from '../../presentation/dto/update-trim.dto';
import { CreateCategoryDto } from '../../presentation/dto/create-category.dto';
import { UpdateCategoryDto } from '../../presentation/dto/update-category.dto';
import { CreateSunroofTypeDto } from '../../presentation/dto/create-sunroof-type.dto';
import { UpdateSunroofTypeDto } from '../../presentation/dto/update-sunroof-type.dto';

@Injectable()
export class VehicleAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Overview Stats ────────────────────────────────────────────────────────
  async getOverview() {
    const [
      totalBrands,
      totalModels,
      totalCategories,
      totalTrims,
      totalSunroofTypes,
      totalColors,
      totalVehicles,
    ] = await Promise.all([
      this.prisma.vehicleBrand.count(),
      this.prisma.vehicleModel.count(),
      this.prisma.vehicleCategory.count(),
      this.prisma.vehicleTrim.count(),
      this.prisma.sunroofType.count(),
      this.prisma.color.count(),
      this.prisma.vehicle.count(),
    ]);

    return {
      totalBrands,
      totalModels,
      totalCategories,
      totalTrims,
      totalSunroofTypes,
      totalColors,
      totalVehicles,
    };
  }

  // ─── Brand (Make) Management ──────────────────────────────────────────────
  async getAllBrandsAdmin() {
    return this.prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' },
      include: {
        models: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { vehicles: true },
            },
          },
        },
        _count: {
          select: {
            models: true,
            vehicles: true,
          },
        },
      },
    });
  }

  async createBrand(dto: CreateBrandDto) {
    const cleanName = dto.name.trim();
    const cleanCode = dto.code ? dto.code.trim().toUpperCase() : null;

    // Check name uniqueness (case-insensitive)
    const existingName = await this.prisma.vehicleBrand.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existingName) {
      throw new BadRequestException(
        `Brand with name "${cleanName}" already exists.`,
      );
    }

    // Check code uniqueness if provided
    if (cleanCode) {
      const existingCode = await this.prisma.vehicleBrand.findUnique({
        where: { code: cleanCode },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Brand code "${cleanCode}" is already taken.`,
        );
      }
    }

    // Extract unique initial models if any
    const initialModels = Array.from(
      new Set(
        (dto.models || [])
          .map((m) => m?.trim())
          .filter((m): m is string => Boolean(m && m.length > 0)),
      ),
    );

    return this.prisma.vehicleBrand.create({
      data: {
        name: cleanName,
        code: cleanCode,
        models:
          initialModels.length > 0
            ? {
                create: initialModels.map((mName) => ({ name: mName })),
              }
            : undefined,
      },
      include: {
        models: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { models: true, vehicles: true },
        },
      },
    });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.vehicleBrand.findUnique({
      where: { id },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" was not found.`);
    }

    const data: { name?: string; code?: string | null } = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException('Brand name cannot be empty.');
      }
      const existing = await this.prisma.vehicleBrand.findFirst({
        where: {
          name: { equals: cleanName, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Another brand with name "${cleanName}" already exists.`,
        );
      }
      data.name = cleanName;
    }

    if (dto.code !== undefined) {
      const cleanCode = dto.code ? dto.code.trim().toUpperCase() : null;
      if (cleanCode) {
        const existingCode = await this.prisma.vehicleBrand.findFirst({
          where: { code: cleanCode, NOT: { id } },
        });
        if (existingCode) {
          throw new BadRequestException(
            `Brand code "${cleanCode}" is already in use.`,
          );
        }
      }
      data.code = cleanCode;
    }

    return this.prisma.vehicleBrand.update({
      where: { id },
      data,
      include: {
        models: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { models: true, vehicles: true },
        },
      },
    });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicles: true, models: true },
        },
      },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${id}" was not found.`);
    }

    if (brand._count.vehicles > 0) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}" because ${brand._count.vehicles} vehicle(s) reference it.`,
      );
    }

    // Check if any model under this brand has vehicles attached
    const modelsWithVehicles = await this.prisma.vehicleModel.count({
      where: {
        brandId: id,
        vehicles: { some: {} },
      },
    });
    if (modelsWithVehicles > 0) {
      throw new BadRequestException(
        `Cannot delete brand "${brand.name}" because vehicles reference its models.`,
      );
    }

    // Delete in transaction: sub-models first, then brand
    return this.prisma.$transaction(async (tx) => {
      await tx.vehicleModel.deleteMany({
        where: { brandId: id },
      });
      return tx.vehicleBrand.delete({
        where: { id },
      });
    });
  }

  // ─── Model Management ─────────────────────────────────────────────────────
  async createModel(brandId: string, dto: CreateModelDto) {
    const cleanName = dto.name.trim();

    const brand = await this.prisma.vehicleBrand.findUnique({
      where: { id: brandId },
    });
    if (!brand) {
      throw new NotFoundException(`Brand with ID "${brandId}" was not found.`);
    }

    // Check model uniqueness under this brand
    const existing = await this.prisma.vehicleModel.findFirst({
      where: {
        brandId,
        name: { equals: cleanName, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Model "${cleanName}" already exists for brand "${brand.name}".`,
      );
    }

    return this.prisma.vehicleModel.create({
      data: {
        brandId,
        name: cleanName,
      },
      include: {
        brand: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async updateModel(id: string, dto: UpdateModelDto) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id },
    });
    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" was not found.`);
    }

    const cleanName = dto.name.trim();
    if (!cleanName) {
      throw new BadRequestException('Model name cannot be empty.');
    }

    const duplicate = await this.prisma.vehicleModel.findFirst({
      where: {
        brandId: model.brandId,
        name: { equals: cleanName, mode: 'insensitive' },
        NOT: { id },
      },
    });
    if (duplicate) {
      throw new BadRequestException(
        `Another model with name "${cleanName}" already exists for this brand.`,
      );
    }

    return this.prisma.vehicleModel.update({
      where: { id },
      data: { name: cleanName },
      include: {
        brand: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async deleteModel(id: string) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
    if (!model) {
      throw new NotFoundException(`Model with ID "${id}" was not found.`);
    }

    if (model._count.vehicles > 0) {
      throw new BadRequestException(
        `Cannot delete model "${model.name}" because ${model._count.vehicles} vehicle(s) reference it.`,
      );
    }

    return this.prisma.vehicleModel.delete({
      where: { id },
    });
  }

  // ─── Color Management ─────────────────────────────────────────────────────
  async getAllColorsAdmin() {
    return this.prisma.color.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async createColor(dto: CreateColorDto) {
    const cleanName = dto.name.trim();
    const cleanNameAr = dto.nameAr?.trim() || null;
    const cleanHex = dto.hex ? dto.hex.trim().toUpperCase() : null;

    const existing = await this.prisma.color.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `Color with name "${cleanName}" already exists.`,
      );
    }

    return this.prisma.color.create({
      data: {
        name: cleanName,
        nameAr: cleanNameAr,
        hex: cleanHex,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async updateColor(id: string, dto: UpdateColorDto) {
    const color = await this.prisma.color.findUnique({
      where: { id },
    });
    if (!color) {
      throw new NotFoundException(`Color with ID "${id}" was not found.`);
    }

    const data: {
      name?: string;
      nameAr?: string | null;
      hex?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException('Color name cannot be empty.');
      }
      const existing = await this.prisma.color.findFirst({
        where: {
          name: { equals: cleanName, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Another color with name "${cleanName}" already exists.`,
        );
      }
      data.name = cleanName;
    }

    if (dto.nameAr !== undefined) {
      data.nameAr = dto.nameAr?.trim() || null;
    }

    if (dto.hex !== undefined) {
      data.hex = dto.hex ? dto.hex.trim().toUpperCase() : null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.color.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async toggleColorStatus(id: string) {
    const color = await this.prisma.color.findUnique({
      where: { id },
    });
    if (!color) {
      throw new NotFoundException(`Color with ID "${id}" was not found.`);
    }

    return this.prisma.color.update({
      where: { id },
      data: { isActive: !color.isActive },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
  }

  async deleteColor(id: string) {
    const color = await this.prisma.color.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });
    if (!color) {
      throw new NotFoundException(`Color with ID "${id}" was not found.`);
    }

    if (color._count.vehicles > 0) {
      throw new BadRequestException(
        `Cannot delete color "${color.name}" because ${color._count.vehicles} vehicle(s) reference it. You can deactivate it instead.`,
      );
    }

    return this.prisma.color.delete({
      where: { id },
    });
  }

  // ─── Trim Management ──────────────────────────────────────────────────────
  async getAllTrimsAdmin() {
    return this.prisma.vehicleTrim.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            vehicles: true,
            originalTrimRequests: true,
          },
        },
      },
    });
  }

  async createTrim(dto: CreateTrimDto) {
    const cleanName = dto.name.trim();
    const cleanNameAr = dto.nameAr?.trim() || null;

    const existing = await this.prisma.vehicleTrim.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `Trim with name "${cleanName}" already exists.`,
      );
    }

    let code: string;
    if (dto.code && dto.code.trim()) {
      code = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const codeExists = await this.prisma.vehicleTrim.findUnique({
        where: { code },
      });
      if (codeExists) {
        throw new BadRequestException(
          `Trim code "${code}" is already in use.`,
        );
      }
    } else {
      let baseCode = cleanName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (!baseCode) {
        baseCode = 'TRIM';
      }
      code = baseCode;
      let counter = 1;
      while (await this.prisma.vehicleTrim.findUnique({ where: { code } })) {
        code = `${baseCode}_${counter++}`;
      }
    }

    return this.prisma.vehicleTrim.create({
      data: {
        code,
        name: cleanName,
        nameAr: cleanNameAr,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        _count: {
          select: {
            vehicles: true,
            originalTrimRequests: true,
          },
        },
      },
    });
  }

  async updateTrim(id: string, dto: UpdateTrimDto) {
    const trim = await this.prisma.vehicleTrim.findUnique({
      where: { id },
    });
    if (!trim) {
      throw new NotFoundException(`Trim with ID "${id}" was not found.`);
    }

    const data: {
      name?: string;
      nameAr?: string | null;
      code?: string;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException('Trim name cannot be empty.');
      }
      const existing = await this.prisma.vehicleTrim.findFirst({
        where: {
          name: { equals: cleanName, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Another trim with name "${cleanName}" already exists.`,
        );
      }
      data.name = cleanName;
    }

    if (dto.nameAr !== undefined) {
      data.nameAr = dto.nameAr?.trim() || null;
    }

    if (dto.code !== undefined && dto.code.trim()) {
      const cleanCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const existingCode = await this.prisma.vehicleTrim.findUnique({
        where: { code: cleanCode },
      });
      if (existingCode && existingCode.id !== id) {
        throw new BadRequestException(
          `Trim code "${cleanCode}" is already in use.`,
        );
      }
      data.code = cleanCode;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.vehicleTrim.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            vehicles: true,
            originalTrimRequests: true,
          },
        },
      },
    });
  }

  async toggleTrimStatus(id: string) {
    const trim = await this.prisma.vehicleTrim.findUnique({
      where: { id },
    });
    if (!trim) {
      throw new NotFoundException(`Trim with ID "${id}" was not found.`);
    }

    return this.prisma.vehicleTrim.update({
      where: { id },
      data: { isActive: !trim.isActive },
      include: {
        _count: {
          select: {
            vehicles: true,
            originalTrimRequests: true,
          },
        },
      },
    });
  }

  async deleteTrim(id: string) {
    const trim = await this.prisma.vehicleTrim.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            originalTrimRequests: true,
          },
        },
      },
    });
    if (!trim) {
      throw new NotFoundException(`Trim with ID "${id}" was not found.`);
    }

    const totalRefs =
      (trim._count?.vehicles || 0) + (trim._count?.originalTrimRequests || 0);
    if (totalRefs > 0) {
      throw new BadRequestException(
        `Cannot delete trim "${trim.name}" because ${totalRefs} vehicle(s)/request(s) reference it. You can deactivate it instead.`,
      );
    }

    return this.prisma.vehicleTrim.delete({
      where: { id },
    });
  }

  // ─── Category Management ──────────────────────────────────────────────────
  async getAllCategoriesAdmin() {
    return this.prisma.vehicleCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            vehicles: true,
            checklists: true,
          },
        },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const cleanName = dto.name.trim();
    const cleanNameAr = dto.nameAr?.trim() || null;

    const existing = await this.prisma.vehicleCategory.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `Category with name "${cleanName}" already exists.`,
      );
    }

    let code: string | null = null;
    if (dto.code && dto.code.trim()) {
      code = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const codeExists = await this.prisma.vehicleCategory.findUnique({
        where: { code },
      });
      if (codeExists) {
        throw new BadRequestException(
          `Category code "${code}" is already in use.`,
        );
      }
    } else {
      let baseCode = cleanName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (baseCode) {
        code = baseCode;
        let counter = 1;
        while (
          await this.prisma.vehicleCategory.findUnique({ where: { code } })
        ) {
          code = `${baseCode}_${counter++}`;
        }
      }
    }

    return this.prisma.vehicleCategory.create({
      data: {
        name: cleanName,
        nameAr: cleanNameAr,
        code,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        _count: {
          select: {
            vehicles: true,
            checklists: true,
          },
        },
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.vehicleCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" was not found.`);
    }

    const data: {
      name?: string;
      nameAr?: string | null;
      code?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException('Category name cannot be empty.');
      }
      const existing = await this.prisma.vehicleCategory.findFirst({
        where: {
          name: { equals: cleanName, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Another category with name "${cleanName}" already exists.`,
        );
      }
      data.name = cleanName;
    }

    if (dto.nameAr !== undefined) {
      data.nameAr = dto.nameAr?.trim() || null;
    }

    if (dto.code !== undefined && dto.code.trim()) {
      const cleanCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const existingCode = await this.prisma.vehicleCategory.findUnique({
        where: { code: cleanCode },
      });
      if (existingCode && existingCode.id !== id) {
        throw new BadRequestException(
          `Category code "${cleanCode}" is already in use.`,
        );
      }
      data.code = cleanCode;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.vehicleCategory.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            vehicles: true,
            checklists: true,
          },
        },
      },
    });
  }

  async toggleCategoryStatus(id: string) {
    const category = await this.prisma.vehicleCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" was not found.`);
    }

    return this.prisma.vehicleCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
      include: {
        _count: {
          select: {
            vehicles: true,
            checklists: true,
          },
        },
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.vehicleCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            checklists: true,
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" was not found.`);
    }

    const totalRefs =
      (category._count?.vehicles || 0) + (category._count?.checklists || 0);
    if (totalRefs > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because ${totalRefs} vehicle(s)/checklist(s) reference it. You can deactivate it instead.`,
      );
    }

    return this.prisma.vehicleCategory.delete({
      where: { id },
    });
  }

  // ─── Sunroof Specification Management ─────────────────────────────────────
  async getAllSunroofTypesAdmin() {
    return this.prisma.sunroofType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createSunroofType(dto: CreateSunroofTypeDto) {
    const cleanName = dto.name.trim();
    const cleanNameAr = dto.nameAr?.trim() || null;

    const existing = await this.prisma.sunroofType.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new BadRequestException(
        `Sunroof specification with name "${cleanName}" already exists.`,
      );
    }

    let code: string;
    if (dto.code && dto.code.trim()) {
      code = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const codeExists = await this.prisma.sunroofType.findUnique({
        where: { code },
      });
      if (codeExists) {
        throw new BadRequestException(
          `Sunroof code "${code}" is already in use.`,
        );
      }
    } else {
      let baseCode = cleanName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      if (!baseCode) {
        baseCode = 'SUNROOF';
      }
      code = baseCode;
      let counter = 1;
      while (await this.prisma.sunroofType.findUnique({ where: { code } })) {
        code = `${baseCode}_${counter++}`;
      }
    }

    return this.prisma.sunroofType.create({
      data: {
        code,
        name: cleanName,
        nameAr: cleanNameAr,
      },
    });
  }

  async updateSunroofType(id: string, dto: UpdateSunroofTypeDto) {
    const sunroof = await this.prisma.sunroofType.findUnique({
      where: { id },
    });
    if (!sunroof) {
      throw new NotFoundException(
        `Sunroof specification with ID "${id}" was not found.`,
      );
    }

    const data: {
      name?: string;
      nameAr?: string | null;
      code?: string;
    } = {};

    if (dto.name !== undefined) {
      const cleanName = dto.name.trim();
      if (!cleanName) {
        throw new BadRequestException(
          'Sunroof specification name cannot be empty.',
        );
      }
      const existing = await this.prisma.sunroofType.findFirst({
        where: {
          name: { equals: cleanName, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Another sunroof specification with name "${cleanName}" already exists.`,
        );
      }
      data.name = cleanName;
    }

    if (dto.nameAr !== undefined) {
      data.nameAr = dto.nameAr?.trim() || null;
    }

    if (dto.code !== undefined && dto.code.trim()) {
      const cleanCode = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const existingCode = await this.prisma.sunroofType.findUnique({
        where: { code: cleanCode },
      });
      if (existingCode && existingCode.id !== id) {
        throw new BadRequestException(
          `Sunroof code "${cleanCode}" is already in use.`,
        );
      }
      data.code = cleanCode;
    }

    return this.prisma.sunroofType.update({
      where: { id },
      data,
    });
  }

  async deleteSunroofType(id: string) {
    const sunroof = await this.prisma.sunroofType.findUnique({
      where: { id },
    });
    if (!sunroof) {
      throw new NotFoundException(
        `Sunroof specification with ID "${id}" was not found.`,
      );
    }

    const refCount = await this.prisma.vehicle.count({
      where: {
        OR: [
          { sunroofSpecification: sunroof.code },
          { sunroofSpecification: sunroof.name },
          { sunroofSpecification: sunroof.nameAr || undefined },
        ],
      },
    });
    if (refCount > 0) {
      throw new BadRequestException(
        `Cannot delete sunroof specification "${sunroof.name}" because ${refCount} vehicle(s) reference it.`,
      );
    }

    return this.prisma.sunroofType.delete({
      where: { id },
    });
  }
}
