import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  SubmitMediaReviewDto,
  VALID_SIDE_MIRROR_CODES,
  VALID_SUNROOF_CODES,
} from './submit-media-review.dto';
import { VALID_CAR_INTERIOR_CODES } from '../../../vehicle/domain/value-objects/car-interior-condition.enum';

describe('SubmitMediaReviewDto Validation', () => {
  const validUUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

  it('passes validation with all valid controlled dropdown values and positive numbers', async () => {
    const payload = {
      verifiedMileage: 45000,
      proposedMarketingValue: 850000,
      transmissionTypeId: validUUID,
      trimId: validUUID,
      sideMirrors: 'ELECTRIC',
      sunroofSpecification: 'PANORAMIC',
      carInterior: 'FACTORY_PAINT',
      notes: 'Vehicle inspected and verified against photo evidence.',
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('passes validation when optional dropdown values are omitted', async () => {
    const payload = {
      verifiedMileage: 30000,
      proposedMarketingValue: 500000,
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects invalid carInterior condition that is not in the controlled enum', async () => {
    const payload = {
      verifiedMileage: 45000,
      proposedMarketingValue: 850000,
      carInterior: 'CUSTOM_METALLIC_PAINT',
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const carInteriorError = errors.find((e) => e.property === 'carInterior');
    expect(carInteriorError).toBeDefined();
    expect(carInteriorError?.constraints?.isIn).toContain(
      "carInterior must be one of: 'FACTORY_PAINT', 'INTERNAL_REPAINT', 'PARTIAL_REPAINT'",
    );
  });

  it('accepts all defined carInterior conditions', async () => {
    for (const code of VALID_CAR_INTERIOR_CODES) {
      const dto = plainToInstance(SubmitMediaReviewDto, {
        verifiedMileage: 10000,
        proposedMarketingValue: 400000,
        carInterior: code,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('rejects invalid sideMirrors value', async () => {
    const payload = {
      verifiedMileage: 45000,
      proposedMarketingValue: 850000,
      sideMirrors: 'FOLDABLE_AUTOMATIC',
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'sideMirrors');
    expect(error).toBeDefined();
    expect(error?.constraints?.isIn).toContain(
      "sideMirrors must be one of: 'MANUAL', 'ELECTRIC'",
    );
  });

  it('accepts all defined sideMirrors options', async () => {
    for (const code of VALID_SIDE_MIRROR_CODES) {
      const dto = plainToInstance(SubmitMediaReviewDto, {
        verifiedMileage: 10000,
        proposedMarketingValue: 400000,
        sideMirrors: code,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('rejects invalid sunroofSpecification value', async () => {
    const payload = {
      verifiedMileage: 45000,
      proposedMarketingValue: 850000,
      sunroofSpecification: 'TARGA_TOP',
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'sunroofSpecification');
    expect(error).toBeDefined();
    expect(error?.constraints?.isIn).toBeDefined();
  });

  it('accepts all defined sunroofSpecification options', async () => {
    for (const code of VALID_SUNROOF_CODES) {
      const dto = plainToInstance(SubmitMediaReviewDto, {
        verifiedMileage: 10000,
        proposedMarketingValue: 400000,
        sunroofSpecification: code,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('rejects non-positive verifiedMileage and proposedMarketingValue', async () => {
    const payload = {
      verifiedMileage: -500,
      proposedMarketingValue: 0,
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'verifiedMileage')).toBe(true);
    expect(errors.some((e) => e.property === 'proposedMarketingValue')).toBe(
      true,
    );
  });

  it('rejects non-UUID transmissionTypeId and trimId', async () => {
    const payload = {
      verifiedMileage: 10000,
      proposedMarketingValue: 400000,
      transmissionTypeId: 'not-a-uuid',
      trimId: '12345',
    };

    const dto = plainToInstance(SubmitMediaReviewDto, payload);
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'transmissionTypeId')).toBe(true);
    expect(errors.some((e) => e.property === 'trimId')).toBe(true);
  });
});
