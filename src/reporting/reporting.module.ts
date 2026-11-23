import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { IdentityModule } from '../identity/identity.module';
import { OrganizationModule } from '../organization/organization.module';
import { MediaModule } from '../media/media.module';
import { REPORT_STORAGE_SERVICE } from './domain/interfaces/report-storage.interface';
import { REPORT_DATA_PROVIDER } from './domain/interfaces/report-data-provider.interface';
import { PDF_GENERATOR_SERVICE } from './domain/interfaces/pdf-generator.interface';
import { QR_CODE_GENERATOR_SERVICE } from './domain/interfaces/qr-code-generator.interface';
import { ReportStorageAdapter } from './infrastructure/adapters/report-storage.adapter';
import { ReportPrismaDataAdapter } from './infrastructure/adapters/report-prisma-data.adapter';
import { PuppeteerPdfGeneratorAdapter } from './infrastructure/adapters/puppeteer-pdf-generator.adapter';
import { QrCodeGeneratorAdapter } from './infrastructure/adapters/qrcode-generator.adapter';
import { ReportIdGeneratorService } from './application/services/report-id-generator.service';
import { GenerateInspectionPdfUseCase } from './application/use-cases/generate-inspection-pdf.use-case';
import { ReportController } from './presentation/controllers/report.controller';

@Module({
  imports: [SharedModule, IdentityModule, OrganizationModule, MediaModule],
  controllers: [ReportController],
  providers: [
    {
      provide: REPORT_STORAGE_SERVICE,
      useClass: ReportStorageAdapter,
    },
    {
      provide: REPORT_DATA_PROVIDER,
      useClass: ReportPrismaDataAdapter,
    },
    {
      provide: PDF_GENERATOR_SERVICE,
      useClass: PuppeteerPdfGeneratorAdapter,
    },
    {
      provide: QR_CODE_GENERATOR_SERVICE,
      useClass: QrCodeGeneratorAdapter,
    },
    ReportIdGeneratorService,
    GenerateInspectionPdfUseCase,
  ],
  exports: [
    GenerateInspectionPdfUseCase,
    REPORT_STORAGE_SERVICE,
    REPORT_DATA_PROVIDER,
    PDF_GENERATOR_SERVICE,
    QR_CODE_GENERATOR_SERVICE,
  ],
})
export class ReportingModule {}
