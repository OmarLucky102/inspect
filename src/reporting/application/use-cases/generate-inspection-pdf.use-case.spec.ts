import {
  GenerateInspectionPdfUseCase,
  GenerateReportPdfInput,
} from './generate-inspection-pdf.use-case';
import type { IReportStorageService } from '../../domain/interfaces/report-storage.interface';
import type { IReportDataProvider } from '../../domain/interfaces/report-data-provider.interface';
import type { IPdfGeneratorService } from '../../domain/interfaces/pdf-generator.interface';
import type { IQrCodeGeneratorService } from '../../domain/interfaces/qr-code-generator.interface';
import { ReportIdGeneratorService } from '../services/report-id-generator.service';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidStatusTransitionException,
  VehicleDataRequiredException,
} from '../../../shared/exceptions/inspection.exceptions';
import { InspectionRawData } from '../../domain/models/report-data.model';

describe('GenerateInspectionPdfUseCase', () => {
  let useCase: GenerateInspectionPdfUseCase;
  let mockStorageService: jest.Mocked<IReportStorageService>;
  let mockDataProvider: jest.Mocked<IReportDataProvider>;
  let mockPdfGenerator: jest.Mocked<IPdfGeneratorService>;
  let mockQrCodeGenerator: jest.Mocked<IQrCodeGeneratorService>;
  let idGenerator: ReportIdGeneratorService;

  const sampleInspection: InspectionRawData = {
    id: 'b6e7f123-1111-2222-3333-444455556666',
    requestNumber: 'REQ-2026-000572',
    currentStatus: 'APPROVED',
    bankId: 'bank-uuid-1',
    bankName: 'National Bank of Egypt',
    requestedAt: new Date('2026-03-24T10:00:00Z'),
    completedAt: new Date('2026-03-24T14:30:00Z'),
    notes: 'Inspection approved and passed.',
    customer: {
      fullName: 'Ahmed Hassan Mohamed',
      nationalId: '29001010101234',
      phone: '+201001234567',
      email: 'ahmed@example.com',
      address: 'New Cairo, Sector 1',
      city: 'Cairo',
      governorate: 'Cairo',
    },
    vehicle: {
      vin: 'W1K2060421F123456',
      plateNumber: '123-ABC',
      manufactureYear: 2023,
      mileage: 24850,
      engineNumber: 'ENG-998877',
      engineCc: 1991,
      power: 204,
      brandName: 'Mercedes-Benz',
      modelName: 'C200',
      trimName: 'AMG Line',
      categoryName: 'Sedan',
      fuelTypeName: 'Gasoline',
      transmissionTypeName: 'Automatic 9G-TRONIC',
      colorName: 'Obsidian Black Metallic',
      sunroofSpecification: 'Panoramic Sliding Sunroof',
      sideMirrors: 'Power Folding Heated',
      carInterior: 'Leather Cognac Brown',
      marketValue: 3250000,
    },
    marketingDecision: {
      estimatedValue: 3250000,
      approved: true,
      notes: 'Market value reflects top-tier secondary market condition.',
      decidedAt: new Date('2026-03-24T15:00:00Z'),
      reviewerName: 'Tarek Mahmoud',
    },
    checklistItems: [
      {
        code: 'CHASSIS_NUMBER',
        label: 'Chassis Number',
        status: 'PASS',
        completed: true,
        notes: 'Chassis stamp verified intact',
      },
      {
        code: 'MILEAGE',
        label: 'Mileage',
        status: 'PASS',
        completed: true,
        notes: 'Odometer cluster verified',
      },
    ],
    media: [
      {
        id: 'media-chassis-1',
        fileUrl: 'inspections/req-1/chassis.jpg',
        mimeType: 'image/jpeg',
        checklistItemCode: 'CHASSIS_NUMBER',
        sortOrder: 1,
        categoryName: 'Chassis',
      },
      {
        id: 'media-odometer-1',
        fileUrl: 'inspections/req-1/odometer.jpg',
        mimeType: 'image/jpeg',
        checklistItemCode: 'MILEAGE',
        sortOrder: 2,
        categoryName: 'Odometer',
      },
      {
        id: 'media-roof-1',
        fileUrl: 'inspections/req-1/roof.jpg',
        mimeType: 'image/jpeg',
        checklistItemCode: 'ROOF',
        sortOrder: 3,
        categoryName: 'Roof',
      },
      {
        id: 'media-exterior-1',
        fileUrl: 'inspections/req-1/exterior1.jpg',
        mimeType: 'image/jpeg',
        sortOrder: 4,
        categoryName: 'Exterior',
      },
    ],
  };

  beforeEach(() => {
    mockStorageService = {
      getFileBuffer: jest.fn().mockResolvedValue({
        buffer: Buffer.from('fake-image-bytes'),
        mimeType: 'image/jpeg',
        size: 16,
      }),
    };

    mockDataProvider = {
      getInspectionReportData: jest.fn().mockResolvedValue(sampleInspection),
      isUserAuthorizedForBank: jest.fn().mockResolvedValue(true),
    };

    mockPdfGenerator = {
      generatePdfFromHtml: jest
        .fn()
        .mockResolvedValue(Buffer.from('%PDF-1.4 mock pdf buffer')),
    };

    mockQrCodeGenerator = {
      generateQrCodeDataUri: jest
        .fn()
        .mockResolvedValue('data:image/png;base64,mockqr'),
    };

    idGenerator = new ReportIdGeneratorService();

    useCase = new GenerateInspectionPdfUseCase(
      mockStorageService,
      mockDataProvider,
      mockPdfGenerator,
      mockQrCodeGenerator,
      idGenerator,
    );
  });

  it('should generate PDF report successfully in Arabic', async () => {
    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'user-1', role: Role.MANAGER },
      lang: 'ar',
    };

    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(result.filename).toBe('EuroInspect-360-Report-REQ-2026-000572.pdf');
    expect(result.reportId).toMatch(/^RPT-\d{4}-\d{6}$/);
    expect(result.systemId).toMatch(/^EIS-\d{4}-\d{3,}$/);

    expect(mockDataProvider.getInspectionReportData).toHaveBeenCalledWith(
      sampleInspection.id,
      'bank-uuid-1',
    );
    expect(mockQrCodeGenerator.generateQrCodeDataUri).toHaveBeenCalled();
    expect(mockStorageService.getFileBuffer).toHaveBeenCalledTimes(4);
    expect(mockPdfGenerator.generatePdfFromHtml).toHaveBeenCalled();
  });

  it('should generate PDF report successfully in English', async () => {
    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
      lang: 'en',
    };

    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(mockPdfGenerator.generatePdfFromHtml).toHaveBeenCalled();
  });

  it('should throw InspectionRequestAccessDeniedException when bank authorization fails', async () => {
    mockDataProvider.isUserAuthorizedForBank.mockResolvedValue(false);

    const input: GenerateReportPdfInput = {
      bankId: 'unauthorized-bank',
      inspectionId: sampleInspection.id,
      actor: { id: 'user-1', role: Role.USER },
      lang: 'ar',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      InspectionRequestAccessDeniedException,
    );
  });

  it('should throw InspectionRequestNotFoundException when inspection does not exist', async () => {
    mockDataProvider.getInspectionReportData.mockResolvedValue(null);

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: 'missing-id',
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      InspectionRequestNotFoundException,
    );
  });

  it('should throw InvalidStatusTransitionException when status is not APPROVED or COMPLETED', async () => {
    mockDataProvider.getInspectionReportData.mockResolvedValue({
      ...sampleInspection,
      currentStatus: 'UNDER_REVIEW',
    });

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      InvalidStatusTransitionException,
    );
  });

  it('should generate PDF report successfully when status is COMPLETED', async () => {
    mockDataProvider.getInspectionReportData.mockResolvedValue({
      ...sampleInspection,
      currentStatus: 'COMPLETED',
    });

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'user-1', role: Role.MANAGER },
      lang: 'ar',
    };

    const result = await useCase.execute(input);
    expect(result).toBeDefined();
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('should throw VehicleDataRequiredException when vehicle is missing', async () => {
    mockDataProvider.getInspectionReportData.mockResolvedValue({
      ...sampleInspection,
      vehicle: null,
    });

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      VehicleDataRequiredException,
    );
  });

  it('should gracefully continue rendering if an image fails to load from storage', async () => {
    mockStorageService.getFileBuffer.mockRejectedValueOnce(
      new Error('S3 connection timeout'),
    );

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
      lang: 'en',
    };

    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(result.pdfBuffer).toBeDefined();
  });

  it('should only hydrate photos for active checklist items and ignore extra random photos', async () => {
    const inspectionWithExtraMedia = {
      ...sampleInspection,
      media: [
        ...sampleInspection.media,
        {
          id: 'media-random-1',
          fileUrl: 'inspections/req-1/random_screenshot.png',
          mimeType: 'image/png',
          sortOrder: 10,
        },
        {
          id: 'media-random-2',
          fileUrl: 'inspections/req-1/unrelated_receipt.jpg',
          mimeType: 'image/jpeg',
          sortOrder: 11,
        },
      ],
    };
    mockDataProvider.getInspectionReportData.mockResolvedValue(
      inspectionWithExtraMedia,
    );

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
      lang: 'en',
    };

    const result = await useCase.execute(input);
    expect(result).toBeDefined();
    // Only 4 calls: 1 exterior + 3 checklist items (chassis, odometer, roof). The 2 random photos are ignored!
    expect(mockStorageService.getFileBuffer).toHaveBeenCalledTimes(4);
    expect(mockStorageService.getFileBuffer).not.toHaveBeenCalledWith(
      'inspections/req-1/random_screenshot.png',
    );
  });

  it('should hydrate custom checklist item photos when added by user', async () => {
    const inspectionWithCustomChecklist = {
      ...sampleInspection,
      photoChecklist: {
        licensePhoto: true,
        airbagPhoto: true,
        roofPhoto: true,
        odometerPhoto: true,
        chassisPhoto: true,
        customFields: [{ id: 'kit-123', name: 'Emergency Kit Verification' }],
      },
      media: [
        ...sampleInspection.media,
        {
          id: 'media-custom-1',
          fileUrl: 'inspections/req-1/emergency_kit.jpg',
          mimeType: 'image/jpeg',
          checklistItemCode: 'custom_kit-123',
          sortOrder: 5,
        },
      ],
    };
    mockDataProvider.getInspectionReportData.mockResolvedValue(
      inspectionWithCustomChecklist,
    );

    const input: GenerateReportPdfInput = {
      bankId: 'bank-uuid-1',
      inspectionId: sampleInspection.id,
      actor: { id: 'admin-1', role: Role.SUPER_ADMIN },
      lang: 'en',
    };

    const result = await useCase.execute(input);
    expect(result).toBeDefined();
    // 5 calls: 1 exterior + 3 standard checklist + 1 custom checklist photo
    expect(mockStorageService.getFileBuffer).toHaveBeenCalledTimes(5);
    expect(mockStorageService.getFileBuffer).toHaveBeenCalledWith(
      'inspections/req-1/emergency_kit.jpg',
    );
  });
});
