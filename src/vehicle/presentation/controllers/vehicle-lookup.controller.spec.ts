import 'reflect-metadata';
import { VehicleLookupController } from './vehicle-lookup.controller';
import {
  CAR_INTERIOR_CONDITIONS,
  CarInteriorCondition,
} from '../../domain/value-objects/car-interior-condition.enum';

describe('VehicleLookupController', () => {
  let controller: VehicleLookupController;
  let mockPrisma: any;
  let mockVehicleAdminService: any;

  beforeEach(() => {
    mockPrisma = {
      vehicleBrand: { findMany: jest.fn().mockResolvedValue([{ id: 'b1', name: 'Toyota' }]) },
      vehicleCategory: { findMany: jest.fn().mockResolvedValue([{ id: 'c1', name: 'Sedan' }]) },
      color: { findMany: jest.fn().mockResolvedValue([{ id: 'col1', name: 'White' }]) },
      fuelType: { findMany: jest.fn().mockResolvedValue([{ id: 'f1', name: 'Petrol' }]) },
      transmissionType: {
        findMany: jest.fn().mockResolvedValue([
          { id: 't1', name: 'Automatic', nameAr: 'أوتوماتيك' },
        ]),
      },
      vehicleTrim: { findMany: jest.fn().mockResolvedValue([{ id: 'tr1', name: 'GLX' }]) },
      sideMirrorType: {
        findMany: jest.fn().mockResolvedValue([
          { code: 'MANUAL', name: 'Manual', nameAr: 'عادي' },
          { code: 'ELECTRIC', name: 'Electric', nameAr: 'كهرباء' },
        ]),
      },
      sunroofType: {
        findMany: jest.fn().mockResolvedValue([
          { code: 'PANORAMIC', name: 'Panoramic Sunroof', nameAr: 'فتحة سقف بانورامية' },
        ]),
      },
    };

    mockVehicleAdminService = {};

    controller = new VehicleLookupController(mockPrisma, mockVehicleAdminService);
  });

  describe('getAllLookups', () => {
    it('returns all reference lookups including carInteriorTypes', async () => {
      const result = await controller.getAllLookups();

      expect(result.status).toBe('success');
      expect(result.data.carInteriorTypes).toEqual(CAR_INTERIOR_CONDITIONS);
      expect(result.data.carInteriorTypes.length).toBe(3);
      expect(result.data.carInteriorTypes.map((c) => c.code)).toEqual([
        CarInteriorCondition.FACTORY_PAINT,
        CarInteriorCondition.INTERNAL_REPAINT,
        CarInteriorCondition.PARTIAL_REPAINT,
      ]);
      expect(result.data.sideMirrorTypes).toHaveLength(2);
      expect(result.data.sunroofTypes).toHaveLength(1);
    });
  });

  describe('getCarInteriors', () => {
    it('returns the standard car interior conditions directly', async () => {
      const result = await controller.getCarInteriors();

      expect(result.status).toBe('success');
      expect(result.data).toEqual(CAR_INTERIOR_CONDITIONS);
    });
  });
});
