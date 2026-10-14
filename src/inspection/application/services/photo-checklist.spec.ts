/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { InspectionPhotoChecklist } from '../../domain/entities/inspection-photo-checklist.entity';
import {
  InvalidDynamicChecklistFieldException,
  InspectionRequestLockedException,
  InspectionRequestAccessDeniedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { ChecklistService } from './checklist.service';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { InspectionStatus } from '../../domain/value-objects/inspection-status.enum';

describe('InspectionPhotoChecklist Domain Entity & ChecklistService', () => {
  describe('InspectionPhotoChecklist Entity', () => {
    it('should initialize with all standard photo fields defaulted to true (Yes)', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');

      expect(checklist.licensePhoto).toBe(true);
      expect(checklist.airbagPhoto).toBe(true);
      expect(checklist.roofPhoto).toBe(true);
      expect(checklist.odometerPhoto).toBe(true);
      expect(checklist.chassisPhoto).toBe(true);
      expect(checklist.customFields).toEqual([]);
    });

    it('should allow toggling standard photo fields to false (No)', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');
      checklist.update({
        licensePhoto: false,
        airbagPhoto: false,
      });

      expect(checklist.licensePhoto).toBe(false);
      expect(checklist.airbagPhoto).toBe(false);
      expect(checklist.roofPhoto).toBe(true); // Unchanged
    });

    it('should default dynamic custom fields to true (Yes) when added', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');
      checklist.update({
        customFields: [
          { name: 'Trunk interior' },
          { name: 'Spare tire condition', required: false },
        ],
      });

      expect(checklist.customFields.length).toBe(2);
      expect(checklist.customFields[0].name).toBe('Trunk interior');
      expect(checklist.customFields[0].required).toBe(true); // Default Yes
      expect(checklist.customFields[1].name).toBe('Spare tire condition');
      expect(checklist.customFields[1].required).toBe(false); // Explicitly No
    });

    it('should reject dynamic custom fields with empty names', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');
      expect(() => {
        checklist.update({
          customFields: [{ name: '   ' }],
        });
      }).toThrow(InvalidDynamicChecklistFieldException);
    });

    it('should reject dynamic custom fields with names longer than 100 characters', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');
      expect(() => {
        checklist.update({
          customFields: [{ name: 'A'.repeat(101) }],
        });
      }).toThrow(InvalidDynamicChecklistFieldException);
    });

    it('should reject duplicate dynamic custom field names', () => {
      const checklist = InspectionPhotoChecklist.createDefault('req-123');
      expect(() => {
        checklist.update({
          customFields: [
            { name: 'Underbody rust' },
            { name: 'underbody rust' },
          ],
        });
      }).toThrow(InvalidDynamicChecklistFieldException);
    });
  });

  describe('ChecklistService Photo Checklist Workflow', () => {
    let service: ChecklistService;
    let mockPhotoRepo: any;
    let mockRequestRepo: any;

    beforeEach(() => {
      mockPhotoRepo = {
        findByRequestId: jest.fn(),
        save: jest.fn(),
        upsert: jest.fn(),
      };
      mockRequestRepo = {
        findById: jest.fn(),
        findByIdAndBankId: jest.fn(),
      };

      service = new ChecklistService(
        {} as any,
        {} as any,
        {} as any,
        mockPhotoRepo,
        mockRequestRepo,
        {} as any,
      );
    });

    it('should enforce role protection: reject unauthorized roles from updating checklist', async () => {
      await expect(
        service.updatePhotoChecklist(
          'bank-1',
          'req-1',
          { licensePhoto: false },
          { id: 'user-rep', role: Role.REPRESENTATIVE }, // Representatives not allowed to configure bank review criteria
        ),
      ).rejects.toThrow(InspectionRequestAccessDeniedException);
    });

    it('should enforce state protection: reject updates on locked / finalized requests (e.g. APPROVED or COMPLETED)', async () => {
      mockRequestRepo.findByIdAndBankId.mockResolvedValue({
        id: 'req-1',
        bankId: 'bank-1',
        currentStatus: InspectionStatus.COMPLETED,
      });

      await expect(
        service.updatePhotoChecklist(
          'bank-1',
          'req-1',
          { licensePhoto: false },
          { id: 'user-reviewer', role: Role.REVIEWER },
        ),
      ).rejects.toThrow(InspectionRequestLockedException);
    });

    it('should allow authorized Bank Reviewer to update standard and dynamic fields on active requests', async () => {
      mockRequestRepo.findByIdAndBankId.mockResolvedValue({
        id: 'req-1',
        bankId: 'bank-1',
        currentStatus: InspectionStatus.PENDING,
      });

      const existing = InspectionPhotoChecklist.createDefault('req-1');
      mockPhotoRepo.findByRequestId.mockResolvedValue(existing);

      const result = await service.updatePhotoChecklist(
        'bank-1',
        'req-1',
        {
          licensePhoto: true,
          airbagPhoto: false, // Toggled to No
          customFields: [{ name: 'Front bumper close-up', required: true }],
        },
        { id: 'user-reviewer', role: Role.REVIEWER },
      );

      expect(mockPhotoRepo.upsert).toHaveBeenCalled();
      expect(result.licensePhoto).toBe(true);
      expect(result.airbagPhoto).toBe(false);
      expect(result.customFields.length).toBe(1);
      expect(result.customFields[0].name).toBe('Front bumper close-up');
      expect(result.customFields[0].required).toBe(true);
    });
  });
});
