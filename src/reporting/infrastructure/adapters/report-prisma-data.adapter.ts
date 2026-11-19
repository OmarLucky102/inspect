import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IReportDataProvider } from '../../domain/interfaces/report-data-provider.interface';
import {
  InspectionRawData,
  ReportChecklistItem,
  ReportMediaItem,
} from '../../domain/models/report-data.model';

@Injectable()
export class ReportPrismaDataAdapter implements IReportDataProvider {
  private readonly logger = new Logger(ReportPrismaDataAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  async getInspectionReportData(
    inspectionId: string,
    bankId: string,
  ): Promise<InspectionRawData | null> {
    const inspection = await this.prisma.inspectionRequest.findFirst({
      where: {
        id: inspectionId,
        ...(bankId ? { bankId } : {}),
      },
      include: {
        bank: {
          select: { id: true, name: true },
        },
        customer: true,
        vehicle: {
          include: {
            brand: true,
            model: true,
            trim: true,
            category: true,
            fuelType: true,
            transmissionType: true,
            color: true,
          },
        },
        marketingDecisions: {
          orderBy: [{ approved: 'desc' }, { decidedAt: 'desc' }],
          take: 1,
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        checklistItems: {
          include: {
            checklistItem: true,
          },
          orderBy: {
            checklistItem: { sortOrder: 'asc' },
          },
        },
        photoChecklist: true,
        governorate: true,
        city: true,
      },
    });

    if (!inspection) {
      return null;
    }

    // Media rows associated with this inspection
    const mediaRows = await this.prisma.media.findMany({
      where: {
        OR: [
          { captureSession: { inspectionRequestId: inspectionId } },
          { fileUrl: { contains: inspectionId } },
        ],
        deletedAt: null,
        mimeType: { startsWith: 'image/' },
      },
      include: {
        category: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const checklistItems: ReportChecklistItem[] = (
      inspection.checklistItems || []
    ).map((item) => {
      let status: 'PASS' | 'FAIL' | 'REVIEW' = 'PASS';
      if (item.reviewDecision === 'FAIL') {
        status = 'FAIL';
      }

      return {
        code: item.checklistItem.code,
        label: item.checklistItem.label,
        value: item.value,
        notes: item.reviewNotes || item.notes,
        status,
        completed: item.completed,
      };
    });

    const media: ReportMediaItem[] = mediaRows.map((m: any) => ({
      id: m.id,
      fileUrl: m.fileUrl,
      mimeType: m.mimeType,
      checklistItemCode: m.checklistItemCode || null,
      sortOrder: m.sortOrder,
      categoryName: m.category?.name,
      fileName: m.fileName,
    }));

    const latestDecision = inspection.marketingDecisions?.[0] || null;
    const reviewerName = latestDecision?.reviewer
      ? [latestDecision.reviewer.firstName, latestDecision.reviewer.lastName]
          .filter(Boolean)
          .join(' ')
      : null;

    return {
      id: inspection.id,
      requestNumber: inspection.requestNumber,
      currentStatus: inspection.currentStatus,
      bankId: inspection.bankId,
      bankName: inspection.bank?.name || 'EuroInspect Partner Bank',
      requestedAt: inspection.requestedAt,
      completedAt: inspection.completedAt,
      notes: inspection.notes,
      customer: {
        fullName: inspection.customer.fullName,
        nationalId: inspection.customer.nationalId,
        phone: inspection.customer.phone,
        email: inspection.customer.email,
        address: inspection.address,
        city: inspection.city?.name,
        cityAr: inspection.city?.nameAr || null,
        governorate: inspection.governorate?.name,
        governorateAr: inspection.governorate?.nameAr || null,
      },
      vehicle: inspection.vehicle
        ? {
            vin: inspection.vehicle.vin,
            plateNumber: inspection.vehicle.plateNumber,
            manufactureYear: inspection.vehicle.manufactureYear,
            mileage: inspection.vehicle.mileage,
            engineNumber: inspection.vehicle.engineNumber,
            engineCc: inspection.vehicle.engineCc,
            power: inspection.vehicle.power,
            brandName: inspection.vehicle.brand?.name,
            modelName: inspection.vehicle.model?.name,
            trimName: inspection.vehicle.trim?.name,
            trimNameAr: inspection.vehicle.trim?.nameAr || null,
            categoryName: inspection.vehicle.category?.name,
            categoryNameAr: inspection.vehicle.category?.nameAr || null,
            fuelTypeName: inspection.vehicle.fuelType?.name,
            fuelTypeNameAr: inspection.vehicle.fuelType?.nameAr || null,
            transmissionTypeName: inspection.vehicle.transmissionType?.name,
            transmissionTypeNameAr:
              inspection.vehicle.transmissionType?.nameAr || null,
            colorName: inspection.vehicle.color?.name,
            colorNameAr: inspection.vehicle.color?.nameAr || null,
            sunroofSpecification: inspection.vehicle.sunroofSpecification,
            sideMirrors: inspection.vehicle.sideMirrors,
            carInterior: inspection.vehicle.carInterior,
            calendarNumber: inspection.vehicle.calendarNumber,
            specialInstructions: inspection.vehicle.specialInstructions,
            marketValue: latestDecision
              ? Number(latestDecision.estimatedValue)
              : null,
          }
        : null,
      marketingDecision: latestDecision
        ? {
            estimatedValue: Number(latestDecision.estimatedValue),
            approved: latestDecision.approved,
            notes: latestDecision.notes,
            decidedAt: latestDecision.decidedAt,
            reviewerName,
          }
        : null,
      checklistItems,
      photoChecklist: inspection.photoChecklist
        ? {
            licensePhoto: inspection.photoChecklist.licensePhoto,
            airbagPhoto: inspection.photoChecklist.airbagPhoto,
            roofPhoto: inspection.photoChecklist.roofPhoto,
            odometerPhoto: inspection.photoChecklist.odometerPhoto,
            chassisPhoto: inspection.photoChecklist.chassisPhoto,
            customFields: Array.isArray(inspection.photoChecklist.customFields)
              ? (inspection.photoChecklist.customFields as any)
              : [],
          }
        : null,
      media,
    };
  }

  async isUserAuthorizedForBank(
    userId: string,
    bankId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') {
      return true;
    }

    const membership = await this.prisma.bankMembership.findFirst({
      where: {
        userId,
        bankId,
        status: 'ACTIVE',
      },
    });

    return !!membership;
  }
}
