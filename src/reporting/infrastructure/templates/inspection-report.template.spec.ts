import { renderInspectionReportHtml } from './inspection-report.template';
import { ReportRenderData } from '../../domain/models/report-data.model';

describe('renderInspectionReportHtml', () => {
  const mockRenderData: ReportRenderData = {
    systemId: 'EIS-2026-999',
    reportId: 'RPT-2026-000123',
    requestId: 'req-uuid-1',
    requestNumber: 'REQ-2026-100',
    bankName: 'National Bank of Egypt',
    verificationDate: '2026-11-18',
    verificationUrl:
      'https://inspect.euroairjet.com/verify?req=REQ-2026-100&id=RPT-2026-000123',
    qrCodeDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA',
    generatedAt: '2026-11-18 12:00:00 UTC',
    lang: 'ar',
    customer: {
      fullName: 'أحمد محمود علي',
      nationalId: '29001011234567',
      phone: '+201001234567',
      address: '15 شارع الثورة، الكوربة',
      city: 'مصر الجديدة',
      governorate: 'القاهرة',
    },
    vehicle: {
      brandName: 'Mercedes-Benz',
      modelName: 'C200',
      trimName: 'AMG Line',
      manufactureYear: 2023,
      vin: 'WDD2050421F123456',
      engineNumber: 'ENG-M264-998877',
      mileage: 18500,
      transmissionTypeName: 'Automatic 9G-Tronic',
      engineCc: 1500,
      power: 204,
      fuelTypeName: 'Gasoline 95',
      fuelTypeNameAr: 'بنزين',
      colorName: 'Obsidian Black',
      colorNameAr: 'أسود',
      sunroofSpecification: 'Panoramic Moonroof',
      sideMirrors: 'Electric Folding',
      calendarNumber: 'CAL-2023-776',
      plateNumber: 'أ ب ج 1234',
      carInterior: 'Leather Red / Black',
      marketValue: 3250000,
    },
    checklistItems: [
      {
        code: 'CHASSIS_NUMBER',
        label: 'Chassis Number & Structural Integrity',
        labelAr: 'رقم الشاسيه والمطابقة الهيكلية',
        status: 'PASS',
        notes: 'مطابق وموثق بالصورة',
        completed: true,
      },
    ],
    reviewerNotes: 'المركبة بحالة ممتازة وخالية من الحوادث.',
    reviewerName: 'م. حسام الدين',
    photos: {
      exterior: ['data:image/jpeg;base64,abc1', 'data:image/jpeg;base64,abc2'],
      chassis: 'data:image/jpeg;base64,chassis1',
      odometer: 'data:image/jpeg;base64,odo1',
      roof: ['data:image/jpeg;base64,roof1', 'data:image/jpeg;base64,roof2'],
    },
  };

  it('should not contain the national ID anywhere in the generated report', () => {
    const htmlAr = renderInspectionReportHtml(mockRenderData);
    expect(htmlAr).not.toContain('29001011234567');
    expect(htmlAr).not.toContain('الرقم القومي');

    const htmlEn = renderInspectionReportHtml({
      ...mockRenderData,
      lang: 'en',
    });
    expect(htmlEn).not.toContain('29001011234567');
    expect(htmlEn).not.toContain('National ID');
  });

  it('should render customer location and phone in distinct separated fields', () => {
    const htmlAr = renderInspectionReportHtml(mockRenderData);
    expect(htmlAr).toContain('اسم العميل');
    expect(htmlAr).toContain('أحمد محمود علي');
    expect(htmlAr).toContain('رقم الهاتف');
    expect(htmlAr).toContain('+201001234567');
    expect(htmlAr).toContain('العنوان');
    expect(htmlAr).toContain('15 شارع الثورة، الكوربة');
    expect(htmlAr).toContain('المدينة');
    expect(htmlAr).toContain('مصر الجديدة');
    expect(htmlAr).toContain('المحافظة');
    expect(htmlAr).toContain('القاهرة');
  });

  it('should render vehicle technical specifications translated to Arabic in Arabic reports', () => {
    const htmlAr = renderInspectionReportHtml(mockRenderData);
    expect(htmlAr).toContain('Mercedes-Benz');
    expect(htmlAr).toContain('C200');
    expect(htmlAr).toContain('AMG Line');
    expect(htmlAr).toContain('2023');
    expect(htmlAr).toContain('WDD2050421F123456');
    expect(htmlAr).toContain('CAL-2023-776');
    expect(htmlAr).toContain('ENG-M264-998877');
    expect(htmlAr).toContain('أوتوماتيك');
    expect(htmlAr).toContain('بنزين');
    expect(htmlAr).toContain('أسود');
    expect(htmlAr).toContain('فتحة سقف بانورامية زجاجية');
    expect(htmlAr).toContain('كهربائية قابلة للطي');
    expect(htmlAr).toContain('أ ب ج 1234');
    expect(htmlAr).toContain('جلد');
  });

  it('should translate sideMirrors to كهربائية and gear to مانيوال and use colorNameAr when provided', () => {
    const manualCarData: ReportRenderData = {
      ...mockRenderData,
      lang: 'ar',
      vehicle: {
        ...mockRenderData.vehicle,
        sideMirrors: 'Electric',
        transmissionTypeName: 'Manual 6-Speed',
        transmissionTypeNameAr: null,
        colorName: 'Red Metallic',
        colorNameAr: 'أحمر كرزي ميتاليك',
        sunroofSpecification: 'Electric Sunroof',
      },
    };

    const htmlAr = renderInspectionReportHtml(manualCarData);
    expect(htmlAr).toContain('كهربائية');
    expect(htmlAr).toContain('مانيوال');
    expect(htmlAr).toContain('أحمر كرزي ميتاليك');
    expect(htmlAr).toContain('فتحة سقف كهربائية');
  });

  it('should keep English terms in English reports', () => {
    const htmlEn = renderInspectionReportHtml({
      ...mockRenderData,
      lang: 'en',
    });
    expect(htmlEn).toContain('Automatic 9G-Tronic');
    expect(htmlEn).toContain('Gasoline 95');
    expect(htmlEn).toContain('Obsidian Black');
    expect(htmlEn).toContain('Panoramic Moonroof');
    expect(htmlEn).toContain('Electric Folding');
  });

  it('should embed the official logo from the CDN at the top of the report', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    expect(html).toContain('logo.webp');
    expect(html).toContain('class="brand-logo-img"');
    expect(html).toContain(
      'https://pub-860509c206114698ad0b355f757c0bf3.r2.dev/logo.webp',
    );
  });

  it('should use the Red brand identity styling', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    // Red theme border in header
    expect(html).toContain('border-bottom: 2px solid #b91c1c;');
    // Red border in verification card
    expect(html).toContain('border: 1.5px solid #dc2626;');
    // Red gradient valuation box
    expect(html).toContain(
      'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
    );
    // Red card-title accent
    expect(html).toContain('border-inline-start: 3.5px solid #dc2626;');
  });

  it('should render stacked vertical field tiles with label on top and value underneath', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    expect(html).toContain('field-tile');
    expect(html).toContain('field-label');
    expect(html).toContain('field-value');
    expect(html).toContain('customer-tiles-grid');
    expect(html).toContain('vehicle-tiles-grid');
  });

  it('should render Page 2 exterior vehicle photos without crop (object-fit: contain)', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    expect(html).toContain('object-fit: contain;');
    expect(html).toContain('photo-caption');
    expect(html).toContain('الزاوية الأمامية للمركبة');
    expect(html).toContain('الزاوية الخلفية للمركبة');
  });

  it('should not contain the certified reviewer assessment card on Page 2', () => {
    const htmlAr = renderInspectionReportHtml(mockRenderData);
    expect(htmlAr).not.toContain('Inspector:');
    expect(htmlAr).not.toContain('تقرير وملاحظات مراجع');
  });

  it('should not contain pseudo filler notes when checklist items have no notes', () => {
    const dataWithoutNotes: ReportRenderData = {
      ...mockRenderData,
      checklistItems: [
        {
          code: 'ROOF',
          label: 'Sunroof',
          labelAr: 'فتحة السقف وسلامة الهيكل العلوي',
          status: 'PASS',
          notes: null,
          completed: true,
        },
      ],
    };

    const html = renderInspectionReportHtml(dataWithoutNotes);
    expect(html).not.toContain('السقف سليم والعزل محكم');
    expect(html).not.toContain('مطابق للفحص والتوثيق');
  });

  it('should not duplicate chassis/VIN in the checklist table', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    expect(html).not.toContain('رقم الشاسيه والمطابقة الهيكلية');
  });

  it('should not contain repetitive pseudo text for chassis engraving', () => {
    const html = renderInspectionReportHtml(mockRenderData);
    expect(html).not.toContain('حالة الحفر: أصلي من المصنع');
    expect(html).not.toContain('علامات تلاعب أو لحام');
  });

  it('should render all inspection photos dynamically grouped 2 per page', () => {
    const dataWithMultiplePhotos: ReportRenderData = {
      ...mockRenderData,
      photos: {
        exterior: ['ext1', 'ext2', 'ext3', 'ext4'],
        allInspectionPhotos: [
          {
            id: '1',
            url: 'data:image/jpeg;base64,1',
            checklistItemCode: 'CHASSIS',
          },
          {
            id: '2',
            url: 'data:image/jpeg;base64,2',
            checklistItemCode: 'ODOMETER',
          },
          {
            id: '3',
            url: 'data:image/jpeg;base64,3',
            checklistItemCode: 'ENGINE',
          },
          {
            id: '4',
            url: 'data:image/jpeg;base64,4',
            checklistItemCode: 'INTERIOR',
          },
          {
            id: '5',
            url: 'data:image/jpeg;base64,5',
            checklistItemCode: 'TIRES',
          },
          {
            id: '6',
            url: 'data:image/jpeg;base64,6',
            checklistItemCode: 'TRUNK',
          },
        ],
      },
    };

    const html = renderInspectionReportHtml(dataWithMultiplePhotos);
    expect(html).toContain('صفحة 1 من 5');
    expect(html).toContain('صفحة 2 من 5');
    expect(html).toContain('صفحة 3 من 5');
    expect(html).toContain('صفحة 4 من 5');
    expect(html).toContain('صفحة 5 من 5');
    expect(html).toContain('evidence-photo-card');
    expect(html).toContain('توثيق رقم الشاسيه المحفور (VIN)');
    expect(html).toContain('توثيق قراءة العداد الرقمي المضيء');
    expect(html).toContain('المقصورة الداخلية والفرش والتابلوه');
  });

  it('should render standard checklist items and include custom items added by user', () => {
    const dataWithCustomChecklist: ReportRenderData = {
      ...mockRenderData,
      checklistItems: [
        {
          code: 'CUSTOM_SEATS',
          label: 'Electric Seat Controls',
          labelAr: 'فحص أزرار وضبط المقاعد الكهربائية',
          status: 'PASS',
          notes: 'Tested and functioning',
          completed: true,
        },
      ],
      photoChecklist: {
        licensePhoto: true,
        airbagPhoto: true,
        roofPhoto: true,
        odometerPhoto: true,
        chassisPhoto: true,
        customFields: [
          {
            id: 'extra-tool',
            name: 'فحص حقيبة الإسعافات والمثلث',
            required: true,
          },
        ],
      },
    };

    const html = renderInspectionReportHtml(dataWithCustomChecklist);
    // Standard items
    expect(html).toContain('قراءة العداد واللوحة الرقمية');
    expect(html).toContain('فتحة السقف وسلامة الهيكل العلوي');
    expect(html).toContain('الوسائد الهوائية وأنظمة الأمان');
    expect(html).toContain('اللوحات المعدنية وأوراق الترخيص');
    expect(html).toContain('حالة حوض المحرك والسوائل');
    expect(html).toContain('منظومة الفرامل والإطارات');

    // Custom items added by user
    expect(html).toContain('فحص أزرار وضبط المقاعد الكهربائية');
    expect(html).toContain('Tested and functioning');
    expect(html).toContain('فحص حقيبة الإسعافات والمثلث');
  });
});
