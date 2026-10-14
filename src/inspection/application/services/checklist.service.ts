import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { IChecklistRepository } from '../../domain/repositories/checklist.repository.interface';
import type { IChecklistItemRepository } from '../../domain/repositories/checklist-item.repository.interface';
import type { IInspectionChecklistItemRepository } from '../../domain/repositories/inspection-checklist-item.repository.interface';
import type { IInspectionPhotoChecklistRepository } from '../../domain/repositories/inspection-photo-checklist.repository.interface';
import type { IInspectionRequestRepository } from '../../domain/repositories/inspection-request.repository.interface';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';
import { InspectionChecklistItem } from '../../domain/entities/inspection-checklist-item.entity';
import { InspectionPhotoChecklist } from '../../domain/entities/inspection-photo-checklist.entity';
import { ChecklistInputType } from '../../domain/value-objects/checklist-input-type.enum';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import {
  ChecklistNotFoundException,
  ChecklistItemNotFoundException,
  MandatoryItemCannotBeModifiedException,
  DuplicateChecklistItemException,
  ChecklistItemNotInBankException,
  InspectionRequestNotFoundException,
  InspectionRequestAccessDeniedException,
  InspectionRequestLockedException,
} from '../../../shared/exceptions/inspection.exceptions';
import { UpdatePhotoChecklistDto } from '../../presentation/dto/update-photo-checklist.dto';
import { PhotoChecklistResponseDto } from '../../presentation/dto/photo-checklist-response.dto';

import { PrismaService } from '../../../database/prisma.service';

export interface AddChecklistItemInput {
  bankId: string;
  checklistId: string;
  code: string;
  label: string;
  description?: string;
  weight?: number;
  inputType?: ChecklistInputType;
  options?: string;
  sortOrder?: number;
}

@Injectable()
export class ChecklistService {
  constructor(
    @Inject('IChecklistRepository')
    private readonly checklistRepository: IChecklistRepository,
    @Inject('IChecklistItemRepository')
    private readonly checklistItemRepository: IChecklistItemRepository,
    @Inject('IInspectionChecklistItemRepository')
    private readonly inspectionChecklistItemRepository: IInspectionChecklistItemRepository,
    @Inject('IInspectionPhotoChecklistRepository')
    private readonly photoChecklistRepository: IInspectionPhotoChecklistRepository,
    @Inject('IInspectionRequestRepository')
    private readonly requestRepository: IInspectionRequestRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getVehicleCategories(): Promise<
    { id: string; name: string; nameAr: string | null; code: string | null }[]
  > {
    return this.prisma.vehicleCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameAr: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  async getChecklistForCategory(
    bankId: string,
    categoryId: string,
  ): Promise<ChecklistItem[]> {
    const mandatoryItems =
      await this.checklistItemRepository.findMandatoryItems();

    // Also include bank-specific custom items added to the base template
    const baseChecklist =
      await this.checklistRepository.findByCode('SYSTEM_MANDATORY');
    const baseCustomItems = baseChecklist
      ? (
          await this.checklistItemRepository.findByChecklistId(baseChecklist.id)
        ).filter((item) => item.bankId === bankId && !item.isMandatory)
      : [];

    const checklists =
      await this.checklistRepository.findByCategoryId(categoryId);
    // There should typically be one active template per category for a given context
    // We will get items from all applicable templates (though usually there is just one)
    const categoryItems: ChecklistItem[] = [...baseCustomItems];
    for (const checklist of checklists) {
      const items = await this.checklistItemRepository.findByChecklistId(
        checklist.id,
      );
      categoryItems.push(...items);
    }

    // Combine them, deduplicating by code in case a custom item tries to override a mandatory one
    const merged = new Map<string, ChecklistItem>();

    // Custom/category items first
    for (const item of categoryItems) {
      if (!item.bankId || item.bankId === bankId) {
        merged.set(item.code, item);
      }
    }

    // Mandatory items override/always present
    for (const item of mandatoryItems) {
      merged.set(item.code, item);
    }

    return Array.from(merged.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async addCustomItemToChecklist(
    input: AddChecklistItemInput,
  ): Promise<ChecklistItem> {
    const checklist = await this.checklistRepository.findById(
      input.checklistId,
    );
    if (!checklist) {
      throw new ChecklistNotFoundException(input.checklistId);
    }

    const items = await this.checklistItemRepository.findByChecklistId(
      checklist.id,
    );
    if (items.some((i) => i.code === input.code)) {
      throw new DuplicateChecklistItemException(input.code);
    }

    const item = new ChecklistItem({
      id: randomUUID(),
      checklistId: input.checklistId,
      bankId: input.bankId, // scoped to bank
      code: input.code,
      label: input.label,
      description: input.description || null,
      isRequired: true, // Defaulting to true, but could be parameter
      isMandatory: false, // Bank admins cannot create mandatory items
      weight: input.weight || 1,
      inputType: input.inputType || ChecklistInputType.TEXT,
      options: input.options || null,
      sortOrder:
        input.sortOrder ||
        (items.length > 0 ? items[items.length - 1].sortOrder + 1 : 1),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await this.checklistItemRepository.save(item);
    return item;
  }

  async removeCustomItem(bankId: string, itemId: string): Promise<void> {
    const item = await this.checklistItemRepository.findById(itemId);
    if (!item || item.isDeleted) {
      throw new ChecklistItemNotFoundException(itemId);
    }

    if (item.isMandatory) {
      throw new MandatoryItemCannotBeModifiedException();
    }

    if (item.bankId && item.bankId !== bankId) {
      throw new ChecklistItemNotInBankException();
    }

    item.markAsDeleted();
    await this.checklistItemRepository.update(item);
  }

  async updateCustomItem(
    bankId: string,
    itemId: string,
    input: Partial<AddChecklistItemInput>,
  ): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findById(itemId);
    if (!item || item.isDeleted) {
      throw new ChecklistItemNotFoundException(itemId);
    }

    // You can edit the properties even if it's mandatory (as requested: "could be edited tho"),
    // BUT we restrict editing bank custom items to their owning bank.
    // System mandatory items (bankId = null) could be restricted to SuperAdmin, but the guard will handle overall access.
    // If we only want banks to edit their own:
    if (item.bankId && item.bankId !== bankId) {
      throw new ChecklistItemNotInBankException();
    }

    // Create a new entity with updated props
    const updatedItem = new ChecklistItem({
      ...item['props'], // quick way to copy
      label: input.label ?? item.label,
      description:
        input.description !== undefined ? input.description : item.description,
      weight: input.weight ?? item.weight,
      inputType: input.inputType ?? item.inputType,
      options: input.options !== undefined ? input.options : item.options,
      sortOrder: input.sortOrder ?? item.sortOrder,
      updatedAt: new Date(),
    });

    await this.checklistItemRepository.update(updatedItem);
    return updatedItem;
  }

  async getChecklistItemsForRequest(
    bankId: string,
    requestId: string,
  ): Promise<InspectionChecklistItem[]> {
    // Basic check that we are returning for a request, assuming auth guard checked bank membership
    return this.inspectionChecklistItemRepository.findByRequestId(requestId);
  }

  async getPhotoChecklist(
    bankId: string,
    requestId: string,
    actor: { id: string; role: Role },
  ): Promise<PhotoChecklistResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    let photoChecklist =
      await this.photoChecklistRepository.findByRequestId(requestId);

    if (!photoChecklist) {
      photoChecklist = InspectionPhotoChecklist.createDefault(requestId);
      await this.photoChecklistRepository.save(photoChecklist);
    }

    return PhotoChecklistResponseDto.fromDomain(photoChecklist);
  }

  async updatePhotoChecklist(
    bankId: string,
    requestId: string,
    dto: UpdatePhotoChecklistDto,
    actor: { id: string; role: Role },
  ): Promise<PhotoChecklistResponseDto> {
    const isGlobalAdmin =
      actor.role === Role.SUPER_ADMIN || actor.role === Role.SYSTEM_ADMIN;

    const allowedRoles: Role[] = [
      Role.MANAGER,
      Role.REVIEWER,
      Role.SUPER_ADMIN,
      Role.SYSTEM_ADMIN,
    ];

    if (!allowedRoles.includes(actor.role)) {
      throw new InspectionRequestAccessDeniedException();
    }

    const request = isGlobalAdmin
      ? await this.requestRepository.findById(requestId)
      : await this.requestRepository.findByIdAndBankId(requestId, bankId);

    if (!request) {
      throw new InspectionRequestNotFoundException(requestId);
    }

    // State protection: locked or finalized inspections cannot be modified
    const lockedStatuses = ['COMPLETED', 'APPROVED', 'CANCELLED', 'REJECTED'];
    if (lockedStatuses.includes(request.currentStatus)) {
      throw new InspectionRequestLockedException(
        `Inspection request is in status '${request.currentStatus}' and cannot be modified`,
      );
    }

    let photoChecklist =
      await this.photoChecklistRepository.findByRequestId(requestId);

    if (!photoChecklist) {
      photoChecklist = InspectionPhotoChecklist.createDefault(requestId);
    }

    photoChecklist.update(dto);

    await this.photoChecklistRepository.upsert(photoChecklist);

    return PhotoChecklistResponseDto.fromDomain(photoChecklist);
  }
}
