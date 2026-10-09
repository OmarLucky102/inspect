import { Vehicle as PrismaVehicle, Prisma } from '@prisma/client';
import { Vehicle } from '../../domain/entities/vehicle.entity';

export class VehicleMapper {
  static toDomain(prismaVehicle: PrismaVehicle): Vehicle {
    return new Vehicle({
      id: prismaVehicle.id,
      vin: prismaVehicle.vin,
      plateNumber: prismaVehicle.plateNumber,
      manufactureYear: prismaVehicle.manufactureYear,
      mileage: prismaVehicle.mileage,
      engineNumber: prismaVehicle.engineNumber,
      engineCc: prismaVehicle.engineCc,
      power: prismaVehicle.power,
      insuranceValue: prismaVehicle.insuranceValue
        ? prismaVehicle.insuranceValue.toNumber()
        : null,
      registrationDate: prismaVehicle.registrationDate,
      status: prismaVehicle.status,
      brandId: prismaVehicle.brandId,
      modelId: prismaVehicle.modelId,
      categoryId: prismaVehicle.categoryId,
      fuelTypeId: prismaVehicle.fuelTypeId,
      transmissionTypeId: prismaVehicle.transmissionTypeId,
      colorId: prismaVehicle.colorId,
      trimId: prismaVehicle.trimId,
      createdAt: prismaVehicle.createdAt,
      updatedAt: prismaVehicle.updatedAt,
      deletedAt: prismaVehicle.deletedAt,
    });
  }

  static toCreateData(vehicle: Vehicle): Prisma.VehicleCreateInput {
    return {
      id: vehicle.id,
      vin: vehicle.vin,
      plateNumber: vehicle.plateNumber,
      manufactureYear: vehicle.manufactureYear,
      mileage: vehicle.mileage,
      engineNumber: vehicle.engineNumber,
      engineCc: vehicle.engineCc,
      power: vehicle.power,
      insuranceValue: vehicle.insuranceValue,
      registrationDate: vehicle.registrationDate,
      status: vehicle.status as import('@prisma/client').VehicleStatus,
      brand: { connect: { id: vehicle.brandId } },
      model: { connect: { id: vehicle.modelId } },
      category: { connect: { id: vehicle.categoryId } },
      color: { connect: { id: vehicle.colorId } },
      ...(vehicle.fuelTypeId
        ? { fuelType: { connect: { id: vehicle.fuelTypeId } } }
        : {}),
      ...(vehicle.transmissionTypeId
        ? { transmissionType: { connect: { id: vehicle.transmissionTypeId } } }
        : {}),
      ...(vehicle.trimId ? { trim: { connect: { id: vehicle.trimId } } } : {}),
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      deletedAt: vehicle.deletedAt,
    };
  }

  static toUpdateData(vehicle: Vehicle): Prisma.VehicleUpdateInput {
    return {
      vin: vehicle.vin,
      plateNumber: vehicle.plateNumber,
      manufactureYear: vehicle.manufactureYear,
      mileage: vehicle.mileage,
      engineNumber: vehicle.engineNumber,
      engineCc: vehicle.engineCc,
      power: vehicle.power,
      insuranceValue: vehicle.insuranceValue,
      registrationDate: vehicle.registrationDate,
      status: vehicle.status as import('@prisma/client').VehicleStatus,
      brand: { connect: { id: vehicle.brandId } },
      model: { connect: { id: vehicle.modelId } },
      category: { connect: { id: vehicle.categoryId } },
      color: { connect: { id: vehicle.colorId } },
      ...(vehicle.fuelTypeId
        ? { fuelType: { connect: { id: vehicle.fuelTypeId } } }
        : { fuelType: { disconnect: true } }),
      ...(vehicle.transmissionTypeId
        ? { transmissionType: { connect: { id: vehicle.transmissionTypeId } } }
        : { transmissionType: { disconnect: true } }),
      ...(vehicle.trimId
        ? { trim: { connect: { id: vehicle.trimId } } }
        : { trim: { disconnect: true } }),
      updatedAt: vehicle.updatedAt,
      deletedAt: vehicle.deletedAt,
    };
  }
}
