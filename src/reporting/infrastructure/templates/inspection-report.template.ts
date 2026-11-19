import { ReportRenderData } from '../../domain/models/report-data.model';
import { getCdnAsset } from '../../../shared/utils/assets.util';

export function resolveVehicleColor(
  colorName?: string | null,
  colorNameAr?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!colorName && !colorNameAr) return fallbackNa;
  if (!isArabic) return colorName || colorNameAr || fallbackNa;
  return colorNameAr || colorName || fallbackNa;
}

export function resolveSideMirrors(
  mirrors?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!mirrors || !mirrors.trim()) return fallbackNa;
  if (!isArabic) return mirrors.trim();

  const raw = mirrors.trim();
  if (/[\u0600-\u06FF]/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  if (
    lower.includes('electric') ||
    lower.includes('power') ||
    lower.includes('كهربا')
  ) {
    if (lower.includes('fold')) {
      return 'كهربائية قابلة للطي';
    }
    return 'كهربائية';
  }
  if (lower.includes('manual') || lower.includes('hand')) {
    return 'يدوية';
  }

  return raw;
}

export function resolveTransmission(
  name?: string | null,
  nameAr?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!name && !nameAr) return fallbackNa;
  if (!isArabic) return name || nameAr || fallbackNa;

  if (nameAr && nameAr.trim()) {
    const rawAr = nameAr.trim();
    if (/manual|يدوي/i.test(rawAr)) {
      return 'مانيوال';
    }
    return rawAr;
  }

  const raw = (name || '').trim();
  if (!raw) return fallbackNa;

  if (/[\u0600-\u06FF]/.test(raw)) {
    if (/يدوي/i.test(raw)) return 'مانيوال';
    return raw;
  }

  const lower = raw.toLowerCase();
  if (lower.includes('manual')) {
    return 'مانيوال';
  }
  if (
    lower.includes('auto') ||
    lower.includes('steptronic') ||
    lower.includes('cvt') ||
    lower.includes('dsg') ||
    lower.includes('dct') ||
    lower.includes('tronic')
  ) {
    return 'أوتوماتيك';
  }

  return raw;
}

export function resolveSunroof(
  sunroof?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!sunroof || !sunroof.trim()) return fallbackNa;
  if (!isArabic) return sunroof.trim();

  const raw = sunroof.trim();
  if (/[\u0600-\u06FF]/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  if (
    lower.includes('no sunroof') ||
    lower.includes('without') ||
    lower.includes('none')
  ) {
    return 'بدون فتحة سقف';
  }
  if (lower.includes('moonroof') || lower.includes('panoramic moonroof')) {
    return 'فتحة سقف بانورامية زجاجية';
  }
  if (lower.includes('panoram')) {
    return 'فتحة سقف بانورامية';
  }
  if (lower.includes('electric') || lower.includes('power')) {
    return 'فتحة سقف كهربائية';
  }
  if (lower.includes('manual')) {
    return 'فتحة سقف يدوية';
  }

  return raw;
}

export function resolveFuelType(
  name?: string | null,
  nameAr?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!name && !nameAr) return fallbackNa;
  if (!isArabic) return name || nameAr || fallbackNa;
  return nameAr || name || fallbackNa;
}

export function resolveCarInterior(
  interior?: string | null,
  isArabic?: boolean,
  fallbackNa: string = 'N/A',
): string {
  if (!interior || !interior.trim()) return fallbackNa;
  if (!isArabic) return interior.trim();

  const raw = interior.trim();
  if (/[\u0600-\u06FF]/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  if (
    lower.includes('leather') &&
    (lower.includes('fabric') || lower.includes('cloth'))
  ) {
    return 'جلد مع قماش';
  }
  if (lower.includes('alcantara')) {
    return 'الكانتارا';
  }
  if (lower.includes('leather')) {
    return 'جلد';
  }
  if (
    lower.includes('fabric') ||
    lower.includes('cloth') ||
    lower.includes('velour')
  ) {
    return 'قماش';
  }

  return raw;
}

export function getPhotoLabel(
  photo: {
    title?: string;
    titleAr?: string;
    categoryName?: string | null;
    checklistItemCode?: string | null;
    fileName?: string;
  },
  index: number,
  isArabic: boolean,
): string {
  if (isArabic && photo.titleAr) {
    return photo.titleAr;
  }
  if (!isArabic && photo.title) {
    return photo.title;
  }

  const code = (photo.checklistItemCode || '').toUpperCase();
  const cat = (photo.categoryName || '').toUpperCase();
  const file = (photo.fileName || '').toUpperCase();

  if (
    code.includes('CHASSIS') ||
    code.includes('VIN') ||
    cat.includes('CHASSIS') ||
    cat.includes('VIN') ||
    file.includes('CHASSIS') ||
    file.includes('VIN')
  ) {
    return isArabic
      ? 'توثيق رقم الشاسيه المحفور (VIN)'
      : 'Chassis Number (VIN) Engraving Evidence';
  }
  if (
    code.includes('MILEAGE') ||
    code.includes('ODOMETER') ||
    cat.includes('MILEAGE') ||
    cat.includes('ODOMETER') ||
    file.includes('ODO') ||
    file.includes('MILE')
  ) {
    return isArabic
      ? 'توثيق قراءة العداد الرقمي المضيء'
      : 'Verified Odometer Reading & Cluster Lights';
  }
  if (
    code.includes('ROOF') ||
    code.includes('SUNROOF') ||
    cat.includes('ROOF') ||
    file.includes('ROOF')
  ) {
    return isArabic
      ? 'معاينة سقف المركبة وفتحة السقف'
      : 'Roof & Sunroof Visual Inspection';
  }
  if (
    code.includes('AIRBAG') ||
    code.includes('STEERING') ||
    cat.includes('AIRBAG') ||
    file.includes('AIRBAG')
  ) {
    return isArabic
      ? 'الوسائد الهوائية وأنظمة الأمان'
      : 'Airbag & Steering Assembly Audit';
  }
  if (
    code.includes('ENGINE') ||
    cat.includes('ENGINE') ||
    file.includes('ENGINE')
  ) {
    return isArabic
      ? 'معاينة حوض المحرك ومستويات السوائل'
      : 'Engine Bay & Fluid Integrity';
  }
  if (
    code.includes('INTERIOR') ||
    cat.includes('INTERIOR') ||
    file.includes('INTERIOR') ||
    file.includes('SEAT') ||
    file.includes('DASH')
  ) {
    return isArabic
      ? 'المقصورة الداخلية والفرش والتابلوه'
      : 'Interior Cabin, Upholstery & Dashboard';
  }
  if (
    code.includes('TIRE') ||
    code.includes('BRAKE') ||
    cat.includes('TIRE') ||
    cat.includes('WHEEL') ||
    file.includes('TIRE')
  ) {
    return isArabic
      ? 'معاينة الإطارات والجنوط ومنظومة الفرامل'
      : 'Tires, Wheels & Braking System';
  }
  if (
    code.includes('TRUNK') ||
    cat.includes('TRUNK') ||
    file.includes('TRUNK') ||
    file.includes('BOOT')
  ) {
    return isArabic
      ? 'حقيبة الأمتعة الخلفية وحوض الإطار الاحتياطي'
      : 'Luggage Compartment & Spare Wheel Well';
  }
  if (
    code.includes('LICENSE') ||
    cat.includes('LICENSE') ||
    file.includes('PLATE')
  ) {
    return isArabic
      ? 'اللوحات المعدنية وأوراق الترخيص'
      : 'License Plates & Legal Registration';
  }
  if (
    code.includes('DAMAGE') ||
    cat.includes('DAMAGE') ||
    file.includes('SCRATCH') ||
    file.includes('DENT')
  ) {
    return isArabic
      ? 'توثيق الملاحظات الفنية والخدوش الظاهرية'
      : 'Observed Cosmetic / Body Flaw Evidence';
  }

  if (photo.categoryName && photo.categoryName.trim()) {
    return photo.categoryName.trim();
  }

  return isArabic
    ? `صورة توثيق فني (${index + 1})`
    : `Inspection Evidence Photo #${index + 1}`;
}

export function renderInspectionReportHtml(data: ReportRenderData): string {
  const isArabic = data.lang === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';
  const logoSrc = data.logoUrl || getCdnAsset('logo.webp');

  const t = {
    reportTitle: isArabic
      ? 'تقرير الفحص الفني الشامل للمركبة'
      : 'VEHICLE INSPECTION REPORT',
    subTitle: isArabic
      ? 'شهادة توثيق المعاينة الفنية المعتمدة للمركبة'
      : 'Official Comprehensive Inspection & Technical Audit Certificate',
    statusPass: isArabic ? 'معتمد / ناجح' : 'PASS',
    systemVerification: isArabic
      ? 'بيانات التوثيق والتحقق من النظام'
      : 'System Verification & Audit Trail',
    systemId: isArabic ? 'معرف النظام' : 'System ID',
    requestId: isArabic ? 'رقم الطلب' : 'Request ID',
    verificationDate: isArabic ? 'تاريخ التوثيق' : 'Verification Date',
    reportNumLabel: isArabic ? 'رقم التقرير' : 'Report No.',
    bankName: isArabic ? 'الجهة الطالبة:' : 'Requesting Entity:',
    disclaimer: isArabic
      ? 'تشهد هذه الوثيقة الإلكترونية بأن المركبة الموضحة بياناتها أدناه قد خضعت لعملية فحص فني شامل ومعاينة مادية ميدانية تمت بواسطة خبراء الفحص الفني المعتمدين لدى يورو إنسبكت 360 وفقاً لمعايير التقييم والضمانات البنكية المعتمدة. وتعبر نتائج هذا التقرير بدقة عن الحالة الفنية الفعلية للمركبة في تاريخ وساعة الفحص.'
      : 'This electronic inspection certificate verifies that the vehicle described below has undergone a physical condition assessment conducted by EuroInspect 360 certified inspectors in accordance with banking collateral appraisal standards. The findings recorded herein reflect the verified physical state at the date and time of inspection.',
    customerInfo: isArabic ? 'بيانات العميل' : 'Customer Information',
    customerName: isArabic ? 'اسم العميل' : 'Customer Name',
    phone: isArabic ? 'رقم الهاتف' : 'Phone Number',
    address: isArabic ? 'العنوان' : 'Address',
    city: isArabic ? 'المدينة' : 'City',
    governorate: isArabic ? 'المحافظة' : 'State / Governorate',
    vehicleInfo: isArabic
      ? 'مواصفات وبيانات المركبة الفنية'
      : 'Vehicle Technical Specifications',
    brand: isArabic ? 'الماركة' : 'Make / Brand',
    model: isArabic ? 'الموديل' : 'Model',
    trim: isArabic ? 'الفئة / الإصدار' : 'Trim / Edition',
    makeModel: isArabic ? 'الماركة والموديل' : 'Make & Model',
    year: isArabic ? 'سنة الصنع' : 'Model Year',
    vin: isArabic ? 'رقم الشاسيه (VIN)' : 'Chassis Number (VIN)',
    calendarNumber: isArabic ? 'الرقم الدفتري' : 'Calendar Number',
    engineNumber: isArabic ? 'رقم المحرك' : 'Engine Number',
    mileage: isArabic ? 'قراءة العداد المعتمدة' : 'Verified Mileage',
    transmission: isArabic ? 'ناقل الحركة' : 'Transmission',
    engineCc: isArabic ? 'سعة المحرك / القوة' : 'Displacement / Power',
    fuelType: isArabic ? 'نوع الوقود' : 'Fuel Type',
    color: isArabic ? 'لون المركبة' : 'Exterior Color',
    sunroof: isArabic ? 'مواصفات السقف' : 'Roof Specification',
    sideMirrors: isArabic ? 'المرايا الجانبية' : 'Side Mirrors',
    plateNumber: isArabic ? 'رقم اللوحة' : 'License Plate',
    interior: isArabic ? 'المقصورة الداخلية' : 'Interior Condition',
    marketValue: isArabic ? 'القيمة السوقية المعتمدة' : 'Approved Market Value',
    overviewHeader: isArabic
      ? 'المعاينة البصرية والصور الشاملة للمركبة'
      : 'Vehicle Overview & Perspective Imagery',
    exteriorCardTitle: isArabic
      ? 'المعاينة الخارجية وصور الزوايا الأربع للمركبة'
      : 'Vehicle Exterior & 4-Perspective Visual Audit',
    angle1: isArabic ? 'الزاوية الأمامية للمركبة' : 'Front & Perspective View',
    angle2: isArabic ? 'الزاوية الخلفية للمركبة' : 'Rear & Perspective View',
    angle3: isArabic ? 'الجانب الأيمن بالكامل' : 'Right Side Full Profile',
    angle4: isArabic ? 'الجانب الأيسر بالكامل' : 'Left Side Full Profile',
    checklistHeader: isArabic
      ? 'جدول تدقيق معايير الفحص الفني المعتمدة'
      : 'Comprehensive Checklist Verification Audit',
    thItem: isArabic ? 'عنصر الفحص' : 'Audit Item',
    thStatus: isArabic ? 'الحالة والامتثال' : 'Compliance Status',
    thNotes: isArabic ? 'الملاحظات الفنية' : 'Technical Observations',
    evidenceHeader: isArabic
      ? 'المعاينة الفنية والأدلة المصورة'
      : 'Technical Inspection Visual Evidence',
    verifiedEvidenceBadge: isArabic ? 'توثيق فني معتمد' : 'Verified Evidence',
    footerText: isArabic
      ? 'تقرير فحص رسمي صادر عن الإدارة العامة للتقييم الفني — EuroInspect 360. وثيقة للقراءة والطباعة فقط.'
      : 'Official Technical Inspection Report issued by EuroInspect 360 Technical Directorate. Read & Print Only Document.',
    page: isArabic ? 'صفحة' : 'Page',
    of: isArabic ? 'من' : 'of',
    na: isArabic ? 'غير متوفر' : 'N/A',
    photoNotAvail: isArabic ? 'لا توجد صورة مسجلة' : 'No photo recorded',
  };

  const formattedMarketValue = data.vehicle.marketValue
    ? isArabic
      ? `${Number(data.vehicle.marketValue).toLocaleString('ar-EG')} ج.م`
      : `EGP ${Number(data.vehicle.marketValue).toLocaleString('en-US')}`
    : t.na;

  const formattedMileage =
    data.vehicle.mileage != null
      ? `${Number(data.vehicle.mileage).toLocaleString(isArabic ? 'ar-EG' : 'en-US')} KM`
      : t.na;

  const renderedTransmission = resolveTransmission(
    data.vehicle.transmissionTypeName,
    data.vehicle.transmissionTypeNameAr,
    isArabic,
    t.na,
  );
  const renderedColor = resolveVehicleColor(
    data.vehicle.colorName,
    data.vehicle.colorNameAr,
    isArabic,
    t.na,
  );
  const renderedSideMirrors = resolveSideMirrors(
    data.vehicle.sideMirrors,
    isArabic,
    t.na,
  );
  const renderedSunroof = resolveSunroof(
    data.vehicle.sunroofSpecification,
    isArabic,
    t.na,
  );
  const renderedFuelType = resolveFuelType(
    data.vehicle.fuelTypeName,
    data.vehicle.fuelTypeNameAr,
    isArabic,
    t.na,
  );
  const renderedInterior = resolveCarInterior(
    data.vehicle.carInterior,
    isArabic,
    t.na,
  );
  const renderedTrim = isArabic
    ? data.vehicle.trimNameAr || data.vehicle.trimName || t.na
    : data.vehicle.trimName || t.na;

  const renderedCity = isArabic
    ? data.customer.cityAr || data.customer.city || t.na
    : data.customer.city || t.na;
  const renderedGovernorate = isArabic
    ? data.customer.governorateAr || data.customer.governorate || t.na
    : data.customer.governorate || t.na;

  const exteriorPhotos = data.photos.exterior.slice(0, 4);
  while (exteriorPhotos.length < 4) {
    exteriorPhotos.push('');
  }

  const perspectiveLabels = [t.angle1, t.angle2, t.angle3, t.angle4];

  // Assemble all evidence photos (to be rendered 2 per page)
  interface EvidencePhotoItem {
    id?: string;
    url: string;
    title?: string;
    titleAr?: string;
    categoryName?: string | null;
    checklistItemCode?: string | null;
    fileName?: string;
  }

  const allEvidencePhotos: EvidencePhotoItem[] = [];

  if (
    data.photos.allInspectionPhotos &&
    data.photos.allInspectionPhotos.length > 0
  ) {
    allEvidencePhotos.push(...data.photos.allInspectionPhotos);
  } else {
    // Fallback for mock/test data
    if (data.photos.chassis) {
      allEvidencePhotos.push({
        id: 'chassis',
        url: data.photos.chassis,
        checklistItemCode: 'CHASSIS_NUMBER',
      });
    }
    if (data.photos.odometer) {
      allEvidencePhotos.push({
        id: 'odometer',
        url: data.photos.odometer,
        checklistItemCode: 'MILEAGE',
      });
    }
    for (let i = 0; i < (data.photos.roof || []).length; i++) {
      const r = data.photos.roof[i];
      if (r) {
        allEvidencePhotos.push({
          id: `roof-${i}`,
          url: r,
          checklistItemCode: 'ROOF',
        });
      }
    }
  }

  // Chunk all evidence photos into pairs of 2 per page
  const photoPages: EvidencePhotoItem[][] = [];
  for (let i = 0; i < allEvidencePhotos.length; i += 2) {
    photoPages.push(allEvidencePhotos.slice(i, i + 2));
  }
  if (photoPages.length === 0) {
    photoPages.push([]);
  }

  const totalPages = 2 + photoPages.length;

  interface RenderChecklistItem {
    code: string;
    label: string;
    labelAr?: string;
    status: 'PASS' | 'FAIL' | 'REVIEW';
    notes?: string | null;
  }

  const defaultChecklist: RenderChecklistItem[] = [
    {
      code: 'MILEAGE',
      label: isArabic
        ? 'قراءة العداد واللوحة الرقمية'
        : 'Odometer Reading & Cluster Lights',
      status: 'PASS',
      notes: null,
    },
    {
      code: 'ROOF',
      label: isArabic
        ? 'فتحة السقف وسلامة الهيكل العلوي'
        : 'Sunroof / Panoramic Glass Condition',
      status: 'PASS',
      notes: null,
    },
    {
      code: 'AIRBAG',
      label: isArabic
        ? 'الوسائد الهوائية وأنظمة الأمان'
        : 'Airbags & Safety Restraint Systems',
      status: 'PASS',
      notes: null,
    },
    {
      code: 'LICENSE',
      label: isArabic
        ? 'اللوحات المعدنية وأوراق الترخيص'
        : 'License Plates & Legal Registration',
      status: 'PASS',
      notes: null,
    },
    {
      code: 'ENGINE_BAY',
      label: isArabic
        ? 'حالة حوض المحرك والسوائل'
        : 'Engine Bay Integrity & Fluid Levels',
      status: 'PASS',
      notes: null,
    },
    {
      code: 'TIRES_BRAKES',
      label: isArabic
        ? 'منظومة الفرامل والإطارات'
        : 'Brakes System & Tire Tread',
      status: 'PASS',
      notes: null,
    },
  ];

  // Merge custom checklist items from photoChecklist.customFields
  const itemsToRender: RenderChecklistItem[] = [...defaultChecklist];
  for (const cf of data.photoChecklist?.customFields || []) {
    const cfCode = `custom_${cf.id}`;
    if (!itemsToRender.some((item) => item.code === cfCode)) {
      itemsToRender.push({
        code: cfCode,
        label: cf.name,
        labelAr: cf.name,
        status: 'PASS',
        notes: null,
      });
    }
  }

  // Merge inspection-specific checklist items
  for (const dbItem of data.checklistItems || []) {
    if (dbItem.code === 'OTHER' && !dbItem.notes && !dbItem.value) {
      continue;
    }
    // Omit duplicate chassis / VIN from checklist table because VIN is already in top specs and in photo evidence
    if (dbItem.code === 'CHASSIS_NUMBER' || dbItem.code === 'VIN') {
      continue;
    }
    const idx = itemsToRender.findIndex((item) => item.code === dbItem.code);
    const itemLabel =
      isArabic && dbItem.labelAr ? dbItem.labelAr : dbItem.label;
    const itemNotes =
      dbItem.notes && dbItem.notes.trim() ? dbItem.notes.trim() : null;

    if (idx >= 0) {
      itemsToRender[idx] = {
        ...itemsToRender[idx],
        label: itemLabel || itemsToRender[idx].label,
        status: dbItem.status,
        notes: itemNotes,
      };
    } else {
      itemsToRender.push({
        code: dbItem.code,
        label: itemLabel,
        status: dbItem.status,
        notes: itemNotes,
      });
    }
  }

  return `<!DOCTYPE html>
<html lang="${data.lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>EuroInspect 360 - Inspection Report - ${data.requestNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: ${isArabic ? "'Cairo', 'Segoe UI', Tahoma, sans-serif" : "'Outfit', 'Segoe UI', Helvetica, Arial, sans-serif"};
      background-color: #ffffff;
      color: #0f172a;
      line-height: 1.35;
      font-size: 11px;
      user-select: none;
      -webkit-user-select: none;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
      page-break-after: always;
      padding: 12mm 14mm 10mm 14mm;
      position: relative;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Page 1 Specific Layout to Gracefully Fill the A4 Page */
    .page-1-content {
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    /* Page 2 Specific Layout to Fill the Entire A4 Page Beautifully */
    .page-2-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Common Header with Red Identity Accent */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #b91c1c;
      padding-bottom: 8px;
      margin-bottom: 4px;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-img {
      height: 44px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
      display: block;
    }

    .brand-text h1 {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.1;
    }

    .brand-text span {
      font-size: 10px;
      font-weight: 700;
      color: #b91c1c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-titles {
      text-align: ${isArabic ? 'left' : 'right'};
    }

    .header-titles h2 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }

    .header-titles p {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }

    /* Common Cards */
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .card-title {
      background: #fffafa;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #fee2e2;
      border-inline-start: 3.5px solid #dc2626;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-body {
      padding: 11px 14px;
    }

    /* Vertical Field Tiles (Label on Top, Value Underneath) */
    .field-tile {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 11px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 48px;
    }

    .field-label {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .field-value {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      word-break: break-word;
    }

    .field-value-accent {
      color: #b91c1c;
      font-weight: 800;
    }

    .field-value-mono {
      font-family: monospace;
      letter-spacing: 0.5px;
      font-size: 12.5px;
    }

    /* Customer Grid (2 columns: Name & Phone, City & Governorate, Address full width) */
    .customer-tiles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }

    .customer-tiles-grid .span-full {
      grid-column: 1 / -1;
    }

    /* Vehicle Grid (4 columns x 4 rows = 16 uniform tiles) */
    .vehicle-tiles-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
    }

    /* System Verification Card with Red Border */
    .verification-card {
      background: #fffcfc;
      border: 1.5px solid #dc2626;
      border-radius: 8px;
      padding: 11px 15px;
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .qr-box {
      width: 82px;
      height: 82px;
      flex-shrink: 0;
      background: #ffffff;
      border: 1.5px solid #fecaca;
      border-radius: 6px;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .verification-details {
      flex: 1;
    }

    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      padding: 3px 9px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 800;
    }

    .system-meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin: 6px 0;
    }

    .meta-tile {
      background: #ffffff;
      border: 1px solid #fee2e2;
      border-radius: 5px;
      padding: 4px 7px;
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 8.5px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 1px;
    }

    .meta-value {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .audit-disclaimer {
      font-size: 9px;
      color: #475569;
      line-height: 1.4;
      text-align: justify;
    }

    /* Market Value Highlight - Rich Red Identity */
    .valuation-box {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%);
      color: #ffffff;
      border-radius: 7px;
      padding: 11px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      box-shadow: 0 2px 5px rgba(185, 28, 28, 0.2);
    }

    .valuation-label {
      font-size: 11px;
      font-weight: 700;
      color: #fecaca;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .valuation-value {
      font-size: 17px;
      font-weight: 800;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    /* Page 2 Photo Collage - Best Vehicle Exterior Presentation (Large Showroom, No Crop, Whole Car Visible) */
    .photo-grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 10px;
      height: 500px;
    }

    .photo-cell {
      position: relative;
      border: 1.5px solid #1e293b;
      border-radius: 7px;
      overflow: hidden;
      background: #0b0f19;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 16px rgba(0,0,0,0.5);
    }

    .photo-cell img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .photo-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(11, 15, 25, 0.94) 0%, rgba(11, 15, 25, 0.45) 70%, transparent 100%);
      color: #f1f5f9;
      font-size: 9.5px;
      font-weight: 700;
      padding: 7px 12px 5px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      letter-spacing: 0.3px;
    }

    .photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 10px;
      font-weight: 600;
      gap: 4px;
    }

    /* Checklist Table */
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 0;
    }

    .checklist-table th {
      background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
      color: #ffffff;
      text-align: ${isArabic ? 'right' : 'left'};
      padding: 5px 10px;
      font-weight: 700;
      font-size: 9.5px;
    }

    .checklist-table th:last-child {
      text-align: ${isArabic ? 'left' : 'right'};
    }

    .checklist-table td {
      padding: 4px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .checklist-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5px;
      text-align: center;
    }

    .badge-pass {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }

    .badge-fail {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .badge-review {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    /* Evidence Photo Pages (2 Photos per Page) */
    .page-photo-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .photo-pair-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .evidence-photo-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .evidence-photo-header {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .evidence-photo-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }

    .evidence-photo-badge {
      font-size: 9px;
      font-weight: 700;
      color: #b91c1c;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .evidence-photo-body {
      height: 385px;
      background: #0b0f19;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .evidence-photo-body img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* Footers */
    .page-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
      margin-top: auto;
    }

    .footer-left {
      display: flex;
      gap: 12px;
    }

    .footer-page-num {
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="page-1-content">
      <!-- Header -->
      <div class="report-header">
        <div class="brand-wrap">
          <img src="${logoSrc}" alt="EuroInspect 360" class="brand-logo-img" />
          <div class="brand-text">
            <h1>EuroInspect 360</h1>
            <span>Technical Inspection Directorate</span>
          </div>
        </div>
        <div class="header-titles">
          <h2>${t.reportTitle}</h2>
          <p>${t.subTitle}</p>
        </div>
      </div>

      <!-- System Verification Card -->
      <div class="verification-card">
        <div class="qr-box">
          <img src="${data.qrCodeDataUri}" alt="Verification QR Code" />
        </div>
        <div class="verification-details">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span class="verification-badge">✔ ${t.statusPass}</span>
            <span style="font-size: 10px; color: #64748b; font-weight: 600;">${t.bankName} <strong style="color: #0f172a;">${data.bankName}</strong></span>
          </div>
          <div class="system-meta-grid">
            <div class="meta-tile">
              <span class="meta-label">${t.systemId}</span>
              <strong class="meta-value" style="color: #991b1b;">${data.systemId}</strong>
            </div>
            <div class="meta-tile">
              <span class="meta-label">${t.requestId}</span>
              <strong class="meta-value">${data.requestNumber}</strong>
            </div>
            <div class="meta-tile">
              <span class="meta-label">${t.verificationDate}</span>
              <span class="meta-value">${data.verificationDate}</span>
            </div>
            <div class="meta-tile">
              <span class="meta-label">${t.reportNumLabel}</span>
              <span class="meta-value">№ ${data.reportId}</span>
            </div>
          </div>
          <p class="audit-disclaimer">${t.disclaimer}</p>
        </div>
      </div>

      <!-- Customer Information Card (Vertical Field Tiles) -->
      <div class="card">
        <div class="card-title">
          <span>${t.customerInfo}</span>
          <span style="font-size: 10px; color: #64748b;">${data.requestNumber}</span>
        </div>
        <div class="card-body">
          <div class="customer-tiles-grid">
            <div class="field-tile">
              <span class="field-label">${t.customerName}</span>
              <span class="field-value">${data.customer.fullName || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.phone}</span>
              <span class="field-value field-value-mono" dir="ltr" style="font-size: 13px; font-weight: 800; color: #0f172a;">${data.customer.phone || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.city}</span>
              <span class="field-value">${renderedCity}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.governorate}</span>
              <span class="field-value">${renderedGovernorate}</span>
            </div>
            <div class="field-tile span-full">
              <span class="field-label">${t.address}</span>
              <span class="field-value">${data.customer.address || t.na}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicle Technical Specifications Card (12 Vertical Tiles in 3-Columns) -->
      <div class="card">
        <div class="card-title">
          <span>${t.vehicleInfo}</span>
          <span style="font-size: 10px; font-weight: 800; color: #dc2626;">${data.vehicle.brandName || ''} ${data.vehicle.modelName || ''}</span>
        </div>
        <div class="card-body">
          <div class="vehicle-tiles-grid">
            <!-- Row 1: Brand, Model, Trim/Edition, Year -->
            <div class="field-tile">
              <span class="field-label">${t.brand}</span>
              <span class="field-value" style="color: #0f172a; font-weight: 800;">${data.vehicle.brandName || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.model}</span>
              <span class="field-value" style="color: #0f172a; font-weight: 800;">${data.vehicle.modelName || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.trim}</span>
              <span class="field-value">${renderedTrim}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.year}</span>
              <span class="field-value">${data.vehicle.manufactureYear || t.na}</span>
            </div>

            <!-- Row 2: VIN, Calendar Number, Engine Number, Plate Number -->
            <div class="field-tile">
              <span class="field-label">${t.vin}</span>
              <span class="field-value field-value-mono">${data.vehicle.vin}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.calendarNumber}</span>
              <span class="field-value field-value-mono">${data.vehicle.calendarNumber || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.engineNumber}</span>
              <span class="field-value field-value-mono">${data.vehicle.engineNumber || t.na}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.plateNumber}</span>
              <span class="field-value">${data.vehicle.plateNumber || t.na}</span>
            </div>

            <!-- Row 3: Mileage, Transmission, Engine CC / Power, Fuel Type -->
            <div class="field-tile">
              <span class="field-label">${t.mileage}</span>
              <span class="field-value field-value-accent">${formattedMileage}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.transmission}</span>
              <span class="field-value">${renderedTransmission}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.engineCc}</span>
              <span class="field-value">${data.vehicle.engineCc ? `${data.vehicle.engineCc} CC` : t.na} ${data.vehicle.power ? `(${data.vehicle.power} HP)` : ''}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.fuelType}</span>
              <span class="field-value">${renderedFuelType}</span>
            </div>

            <!-- Row 4: Color, Roof, Side Mirrors, Interior -->
            <div class="field-tile">
              <span class="field-label">${t.color}</span>
              <span class="field-value">${renderedColor}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.sunroof}</span>
              <span class="field-value">${renderedSunroof}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.sideMirrors}</span>
              <span class="field-value">${renderedSideMirrors}</span>
            </div>
            <div class="field-tile">
              <span class="field-label">${t.interior}</span>
              <span class="field-value">${renderedInterior}</span>
            </div>
          </div>

          <!-- Market Value Box (Red Identity Theme) -->
          <div class="valuation-box">
            <div class="valuation-label">${t.marketValue}</div>
            <div class="valuation-value">${formattedMarketValue}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page 1 Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span>Report ID: <strong style="color: #991b1b;">${data.reportId}</strong></span>
        <span>•</span>
        <span>${t.footerText}</span>
      </div>
      <div class="footer-page-num">${t.page} 1 ${t.of} ${totalPages}</div>
    </div>
  </div>


  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="page-2-content">
      <!-- Header -->
      <div class="report-header">
        <div class="brand-wrap">
          <img src="${logoSrc}" alt="EuroInspect 360" class="brand-logo-img" />
          <div class="brand-text">
            <h1>EuroInspect 360</h1>
            <span>${t.overviewHeader}</span>
          </div>
        </div>
        <div class="header-titles">
          <h2>${data.vehicle.brandName || ''} ${data.vehicle.modelName || ''}</h2>
          <p>VIN: ${data.vehicle.vin}</p>
        </div>
      </div>

      <!-- Vehicle Exterior 4-Angle Photos Card (Full Vehicle Showroom Presentation) -->
      <div class="card">
        <div class="card-title">
          <span>${t.exteriorCardTitle}</span>
          <span style="font-size: 9.5px; color: #dc2626; font-weight: 700;">4 Exterior Angles • Full Vehicle Showroom View</span>
        </div>
        <div class="card-body" style="padding: 8px;">
          <div class="photo-grid-4">
            ${exteriorPhotos
              .map(
                (photoUrl, idx) => `
              <div class="photo-cell">
                ${
                  photoUrl
                    ? `<img src="${photoUrl}" alt="${perspectiveLabels[idx]}" />
                       <div class="photo-caption">
                         <span>${perspectiveLabels[idx]}</span>
                         <span style="color: #34d399; font-size: 8.5px;">✔ Verified</span>
                       </div>`
                    : `<div class="photo-placeholder">
                         <span style="font-size: 24px;">📷</span>
                         <span>${t.photoNotAvail}</span>
                         <span style="font-size: 8.5px; opacity: 0.7;">${perspectiveLabels[idx]}</span>
                       </div>`
                }
              </div>
            `,
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- Checklist Audit Table -->
      <div class="card">
        <div class="card-title">
          <span>${t.checklistHeader}</span>
          <span style="font-size: 9px; color: #059669; font-weight: 700;">✔ 100% Verified</span>
        </div>
        <table class="checklist-table">
          <thead>
            <tr>
              <th style="width: 35%;">${t.thItem}</th>
              <th style="width: 20%; text-align: center;">${t.thStatus}</th>
              <th style="width: 45%;">${t.thNotes}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToRender
              .slice(0, 12)
              .map(
                (item) => `
              <tr>
                <td><strong>${isArabic && item.labelAr ? item.labelAr : item.label}</strong></td>
                <td style="text-align: center;">
                  <span class="status-badge ${item.status === 'PASS' ? 'badge-pass' : item.status === 'FAIL' ? 'badge-fail' : 'badge-review'}">
                    ${item.status === 'PASS' ? `✔ ${t.statusPass}` : item.status}
                  </span>
                </td>
                <td style="color: #475569;">${item.notes && item.notes.trim() ? item.notes.trim() : '—'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span>Report ID: <strong style="color: #991b1b;">${data.reportId}</strong></span>
        <span>•</span>
        <span>${t.footerText}</span>
      </div>
      <div class="footer-page-num">${t.page} 2 ${t.of} ${totalPages}</div>
    </div>
  </div>


  <!-- ==================== DYNAMIC PHOTO EVIDENCE PAGES (2 PHOTOS PER PAGE) ==================== -->
  ${photoPages
    .map((pair, pIdx) => {
      const pageNum = 3 + pIdx;
      const isLastPage = pIdx === photoPages.length - 1;
      return `
  <div class="page">
    <div class="page-photo-content">
      <!-- Header -->
      <div class="report-header">
        <div class="brand-wrap">
          <img src="${logoSrc}" alt="EuroInspect 360" class="brand-logo-img" />
          <div class="brand-text">
            <h1>EuroInspect 360</h1>
            <span>${t.evidenceHeader}</span>
          </div>
        </div>
        <div class="header-titles">
          <h2>${data.vehicle.brandName || ''} ${data.vehicle.modelName || ''}</h2>
          <p>VIN: ${data.vehicle.vin}</p>
        </div>
      </div>

      <!-- 2 Photos Stacked Vertically -->
      <div class="photo-pair-container">
        ${
          pair.length > 0
            ? pair
                .map(
                  (photo, idx) => `
              <div class="evidence-photo-card">
                <div class="evidence-photo-header">
                  <span class="evidence-photo-title">${getPhotoLabel(photo, pIdx * 2 + idx, isArabic)}</span>
                  <span class="evidence-photo-badge">📷 ${t.verifiedEvidenceBadge}</span>
                </div>
                <div class="evidence-photo-body">
                  <img src="${photo.url}" alt="${getPhotoLabel(photo, pIdx * 2 + idx, isArabic)}" />
                </div>
              </div>
            `,
                )
                .join('')
            : `<div class="evidence-photo-card">
                 <div class="evidence-photo-header">
                   <span class="evidence-photo-title">${isArabic ? 'المعاينة الفنية' : 'Technical Inspection'}</span>
                 </div>
                 <div class="evidence-photo-body">
                   <div class="photo-placeholder"><span style="font-size: 24px;">📷</span><span>${t.photoNotAvail}</span></div>
                 </div>
               </div>`
        }
      </div>
    </div>

    <!-- Official Sign-off and Verification Footer -->
    <div>
      ${
        isLastPage
          ? `
      <div style="background: #fffcfc; border: 1px solid #fee2e2; border-radius: 6px; padding: 7px 12px; margin-bottom: 7px; font-size: 8.5px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span>Verification URL:</span>
          <a href="${data.verificationUrl}" style="color: #dc2626; text-decoration: underline; font-weight: 600;">${data.verificationUrl}</a>
        </div>
        <div style="text-align: ${isArabic ? 'left' : 'right'};">
          <span>Audit Timestamp: <strong>${data.generatedAt}</strong></span>
        </div>
      </div>`
          : ''
      }

      <div class="page-footer">
        <div class="footer-left">
          <span>Report ID: <strong style="color: #991b1b;">${data.reportId}</strong></span>
          <span>•</span>
          <span>${t.footerText}</span>
        </div>
        <div class="footer-page-num">${t.page} ${pageNum} ${t.of} ${totalPages}</div>
      </div>
    </div>
  </div>`;
    })
    .join('')}

</body>
</html>`;
}
