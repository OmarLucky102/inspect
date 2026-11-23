import {
  Inject,
  Injectable,
  Logger,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { REPORT_STORAGE_SERVICE } from '../../domain/interfaces/report-storage.interface';
import type { IReportStorageService } from '../../domain/interfaces/report-storage.interface';
import { REPORT_DATA_PROVIDER } from '../../domain/interfaces/report-data-provider.interface';
import type { IReportDataProvider } from '../../domain/interfaces/report-data-provider.interface';
import { PDF_GENERATOR_SERVICE } from '../../domain/interfaces/pdf-generator.interface';
import type { IPdfGeneratorService } from '../../domain/interfaces/pdf-generator.interface';
import { QR_CODE_GENERATOR_SERVICE } from '../../domain/interfaces/qr-code-generator.interface';
import type { IQrCodeGeneratorService } from '../../domain/interfaces/qr-code-generator.interface';
import { ReportIdGeneratorService } from '../services/report-id-generator.service';
import type { IImageProcessorService } from '../../../media/domain/services/image-processor.service.interface';
import { REPORT_LOGO_BASE64 } from '../../infrastructure/assets/logo.asset';
import {
  InspectionRawData,
  ReportMediaItem,
  ReportRenderData,
  HydratedReportPhoto,
} from '../../domain/models/report-data.model';
import { ReportLanguage } from '../../domain/models/report-language.type';
import { renderInspectionReportHtml } from '../../infrastructure/templates/inspection-report.template';
import {
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InvalidStatusTransitionException,
  VehicleDataRequiredException,
} from '../../../shared/exceptions/inspection.exceptions';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { getCdnAsset } from '../../../shared/utils/assets.util';

export interface GenerateReportPdfInput {
  bankId: string;
  inspectionId: string;
  actor: {
    id: string;
    role: Role;
  };
  lang?: ReportLanguage;
}

export interface GeneratedReportResult {
  pdfBuffer: Buffer;
  filename: string;
  reportId: string;
  systemId: string;
}

@Injectable()
export class GenerateInspectionPdfUseCase {
  private readonly logger = new Logger(GenerateInspectionPdfUseCase.name);

  constructor(
    @Inject(REPORT_STORAGE_SERVICE)
    private readonly storageService: IReportStorageService,
    @Inject(REPORT_DATA_PROVIDER)
    private readonly dataProvider: IReportDataProvider,
    @Inject(PDF_GENERATOR_SERVICE)
    private readonly pdfGenerator: IPdfGeneratorService,
    @Inject(QR_CODE_GENERATOR_SERVICE)
    private readonly qrCodeGenerator: IQrCodeGeneratorService,
    private readonly idGenerator: ReportIdGeneratorService,
    @Optional()
    @Inject('IImageProcessorService')
    private readonly imageProcessor?: IImageProcessorService,
  ) {}

  async execute(input: GenerateReportPdfInput): Promise<GeneratedReportResult> {
    const { bankId, inspectionId, actor } = input;
    const lang: ReportLanguage = input.lang === 'ar' ? 'ar' : 'en';

    // 1. Authorization Verification
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    if (!isGlobalAdmin) {
      const isAuthorized = await this.dataProvider.isUserAuthorizedForBank(
        actor.id,
        bankId,
      );
      if (!isAuthorized) {
        throw new InspectionRequestAccessDeniedException();
      }
    }

    // 2. Fetch Inspection Raw Data
    const inspection = await this.dataProvider.getInspectionReportData(
      inspectionId,
      bankId,
    );

    if (!inspection) {
      throw new InspectionRequestNotFoundException(inspectionId);
    }

    if (inspection.bankId !== bankId && !isGlobalAdmin) {
      throw new InspectionRequestAccessDeniedException();
    }

    // 3. Status Transition Assertion (Must be APPROVED or COMPLETED)
    if (
      inspection.currentStatus !== 'APPROVED' &&
      inspection.currentStatus !== 'COMPLETED'
    ) {
      throw new InvalidStatusTransitionException(
        'Inspection report is locked and will become available once vehicle details and pricing review are submitted.',
      );
    }

    // 4. Vehicle Verification
    if (!inspection.vehicle) {
      throw new VehicleDataRequiredException();
    }

    // 5. Generate Deterministic IDs & Verification URL
    const requestedDate = inspection.requestedAt || new Date();
    const systemId = this.idGenerator.generateSystemId(
      inspection.requestNumber,
      requestedDate,
    );
    const reportId = this.idGenerator.generateReportId(
      inspection.requestNumber,
      requestedDate,
    );

    const baseUrl =
      process.env.REPORT_VERIFY_BASE_URL ||
      'https://inspect.euroairjet.com/verify';
    const verificationUrl = `${baseUrl}?req=${encodeURIComponent(inspection.requestNumber)}&id=${encodeURIComponent(reportId)}`;

    // 6. Generate QR Code Data URI
    const qrCodeDataUri =
      await this.qrCodeGenerator.generateQrCodeDataUri(verificationUrl);

    // 7. Hydrate Media Photos into Base64 Data URIs via S3StorageService Adapter
    const photos = await this.resolveAndHydrateMedia(inspection);

    // 8. Assemble Complete Render Data
    const verificationDateStr = (inspection.completedAt || new Date())
      .toISOString()
      .split('T')[0];

    const renderData: ReportRenderData = {
      systemId,
      reportId,
      requestId: inspection.id,
      requestNumber: inspection.requestNumber,
      bankName: inspection.bankName,
      verificationDate: verificationDateStr,
      verificationUrl,
      qrCodeDataUri,
      generatedAt:
        new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      lang,
      customer: inspection.customer,
      vehicle: inspection.vehicle,
      checklistItems: inspection.checklistItems,
      photoChecklist: inspection.photoChecklist,
      reviewerNotes: inspection.marketingDecision?.notes || inspection.notes,
      reviewerName: inspection.marketingDecision?.reviewerName,
      photos,
      logoUrl: REPORT_LOGO_BASE64,
    };

    // 9. Render HTML Template
    const html = renderInspectionReportHtml(renderData);

    // 10. Generate PDF Buffer via Puppeteer
    try {
      const pdfBuffer = await this.pdfGenerator.generatePdfFromHtml(html);
      const filename = `EuroInspect-360-Report-${inspection.requestNumber}.pdf`;

      return {
        pdfBuffer,
        filename,
        reportId,
        systemId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to render PDF for inspection request '${inspection.id}': ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate inspection report PDF document.',
      );
    }
  }

  private async resolveAndHydrateMedia(inspection: InspectionRawData): Promise<{
    exterior: string[];
    chassis: string | null;
    odometer: string | null;
    roof: string[];
    allInspectionPhotos: HydratedReportPhoto[];
  }> {
    const mediaList = inspection.media || [];

    // Helper matchers
    const isChassis = (m: ReportMediaItem) =>
      /chassis|vin/i.test(m.checklistItemCode || '') ||
      /chassis|vin/i.test(m.categoryName || '') ||
      /chassis|vin/i.test(m.fileName || '');

    const isOdometer = (m: ReportMediaItem) =>
      /odometer|mileage/i.test(m.checklistItemCode || '') ||
      /odometer|mileage/i.test(m.categoryName || '') ||
      /odometer|mileage/i.test(m.fileName || '');

    const isRoof = (m: ReportMediaItem) =>
      /roof|sunroof/i.test(m.checklistItemCode || '') ||
      /roof|sunroof/i.test(m.categoryName || '') ||
      /roof|sunroof/i.test(m.fileName || '');

    const isExterior = (m: ReportMediaItem) =>
      /exterior/i.test(m.checklistItemCode || '') ||
      /exterior/i.test(m.categoryName || '') ||
      /exterior/i.test(m.fileName || '');

    // 1. Separate exterior 4-angles
    let exteriorItems = mediaList.filter(isExterior);
    if (exteriorItems.length === 0) {
      exteriorItems = mediaList
        .filter((m) => !isChassis(m) && !isOdometer(m) && !isRoof(m))
        .slice(0, 4);
    } else {
      exteriorItems = exteriorItems.slice(0, 4);
    }

    const nonExteriorMedia = mediaList.filter(
      (m) => !exteriorItems.includes(m),
    );

    // 2. Define checklist slots — strictly Chassis, Odometer, and Roof ONLY.
    // All other checklist photos are ignored and never downloaded from SeaweedFS.
    interface ChecklistSlot {
      code: string;
      title: string;
      titleAr: string;
      match: (m: ReportMediaItem) => boolean;
    }

    const slots: ChecklistSlot[] = [
      {
        code: 'CHASSIS_NUMBER',
        title: 'Chassis VIN Stamping',
        titleAr: 'توثيق رقم وحفر الشاسيه الميداني (VIN)',
        match: isChassis,
      },
      {
        code: 'MILEAGE',
        title: 'Verified Odometer Reading & Cluster Lights',
        titleAr: 'توثيق قراءة العداد الرقمي المضيء',
        match: isOdometer,
      },
      {
        code: 'ROOF',
        title: 'Roof & Sunroof Visual Inspection',
        titleAr: 'معاينة سقف المركبة وفتحة السقف',
        match: isRoof,
      },
    ];

    // Match each slot to AT MOST ONE media item from nonExteriorMedia
    const usedMediaIds = new Set<string>();
    const matchedEvidenceItems: {
      item: ReportMediaItem;
      slot: ChecklistSlot;
    }[] = [];

    for (const slot of slots) {
      const match = nonExteriorMedia.find(
        (m) => !usedMediaIds.has(m.id) && slot.match(m),
      );
      if (match) {
        usedMediaIds.add(match.id);
        matchedEvidenceItems.push({ item: match, slot });
      }
    }

    // Hydrate exterior photos
    const exteriorBase64s = (
      await Promise.all(exteriorItems.map((e) => this.mediaToBase64(e)))
    ).filter(Boolean) as string[];

    // Hydrate matched checklist evidence photos only
    const hydratedEvidence = await Promise.all(
      matchedEvidenceItems.map(async ({ item, slot }) => {
        const base64 = await this.mediaToBase64(item);
        if (!base64) return null;
        const photo: HydratedReportPhoto = {
          id: item.id,
          url: base64,
          title: slot.title,
          titleAr: slot.titleAr,
          categoryName: item.categoryName,
          checklistItemCode: slot.code,
          fileName: item.fileName,
        };
        return photo;
      }),
    );
    const validEvidencePhotos = hydratedEvidence.filter(
      Boolean,
    ) as HydratedReportPhoto[];

    // Fallback references for legacy callers (reuse already hydrated photos, no duplicate fetch)
    const photoMap = new Map<string, string>();
    for (const p of validEvidencePhotos) {
      photoMap.set(p.id, p.url);
    }

    const chassisEntry = matchedEvidenceItems.find(
      (e) => e.slot.code === 'CHASSIS_NUMBER',
    );
    const odometerEntry = matchedEvidenceItems.find(
      (e) => e.slot.code === 'MILEAGE',
    );
    const roofEntries = matchedEvidenceItems.filter(
      (e) => e.slot.code === 'ROOF',
    );

    const chassisBase64 = chassisEntry
      ? photoMap.get(chassisEntry.item.id) || null
      : null;
    const odometerBase64 = odometerEntry
      ? photoMap.get(odometerEntry.item.id) || null
      : null;
    const roofBase64s = roofEntries
      .slice(0, 2)
      .map((r) => photoMap.get(r.item.id))
      .filter(Boolean) as string[];

    return {
      exterior: exteriorBase64s,
      chassis: chassisBase64,
      odometer: odometerBase64,
      roof: roofBase64s,
      allInspectionPhotos: validEvidencePhotos,
    };
  }

  private async mediaToBase64(item: ReportMediaItem): Promise<string | null> {
    try {
      const file = await this.storageService.getFileBuffer(item.fileUrl);
      let buffer = file.buffer;
      if (this.imageProcessor) {
        buffer = await this.imageProcessor.optimizeForReport(file.buffer);
      }
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.warn(
        `Failed to hydrate media item '${item.id}' with storage key '${item.fileUrl}': ${(error as Error).message}`,
      );
      return null;
    }
  }
}
