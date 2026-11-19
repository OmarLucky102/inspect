import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportIdGeneratorService {
  generateSystemId(requestNumber: string, date: Date = new Date()): string {
    const year = date.getFullYear();
    const cleanNumber = requestNumber.replace(/[^0-9]/g, '');
    const seq = cleanNumber ? cleanNumber.slice(-6).padStart(3, '0') : '001';
    return `EIS-${year}-${seq}`;
  }

  generateReportId(requestNumber: string, date: Date = new Date()): string {
    const year = date.getFullYear();
    const cleanNumber = requestNumber.replace(/[^0-9]/g, '');
    const seq = cleanNumber ? cleanNumber.slice(-6).padStart(6, '0') : '000001';
    return `RPT-${year}-${seq}`;
  }
}
