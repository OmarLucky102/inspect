import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { GenerateInspectionPdfUseCase } from '../../application/use-cases/generate-inspection-pdf.use-case';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { BankMembershipGuard } from '../../../organization/presentation/guards/bank-membership.guard';
import type { Response } from 'express';

describe('ReportController', () => {
  let controller: ReportController;
  let useCase: jest.Mocked<GenerateInspectionPdfUseCase>;

  beforeEach(async () => {
    useCase = {
      execute: jest.fn().mockResolvedValue({
        pdfBuffer: Buffer.from('%PDF-1.4 test buffer'),
        filename: 'EuroInspect-360-Report-REQ-123.pdf',
        reportId: 'RPT-2026-000123',
        systemId: 'EIS-2026-123',
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: GenerateInspectionPdfUseCase,
          useValue: useCase,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(BankMembershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should stream PDF with correct headers and inline disposition', async () => {
    const res = {
      set: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await controller.downloadPdfReport(
      'bank-1',
      'req-1',
      { lang: 'ar' },
      { id: 'user-1', role: Role.MANAGER },
      res,
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      bankId: 'bank-1',
      inspectionId: 'req-1',
      actor: { id: 'user-1', role: Role.MANAGER },
      lang: 'ar',
    });

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'inline; filename="EuroInspect-360-Report-REQ-123.pdf"',
        'X-Report-Id': 'RPT-2026-000123',
        'X-System-Id': 'EIS-2026-123',
      }),
    );
    expect(res.end).toHaveBeenCalled();
  });

  it('should set attachment disposition when download query parameter is true', async () => {
    const res = {
      set: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await controller.downloadPdfReport(
      'bank-1',
      'req-1',
      { lang: 'en', download: 'true' },
      { id: 'admin-1', role: Role.SUPER_ADMIN },
      res,
    );

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Disposition':
          'attachment; filename="EuroInspect-360-Report-REQ-123.pdf"',
      }),
    );
  });
});
