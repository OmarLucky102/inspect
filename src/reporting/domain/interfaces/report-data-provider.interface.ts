import { InspectionRawData } from '../models/report-data.model';

export const REPORT_DATA_PROVIDER = Symbol('REPORT_DATA_PROVIDER');

export interface IReportDataProvider {
  getInspectionReportData(
    inspectionId: string,
    bankId: string,
  ): Promise<InspectionRawData | null>;

  isUserAuthorizedForBank(userId: string, bankId: string): Promise<boolean>;
}
