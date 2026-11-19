import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { BankMembershipGuard } from '../../../organization/presentation/guards/bank-membership.guard';
import { Roles } from '../../../identity/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { Role } from '../../../identity/domain/value-objects/role.enum';
import { GenerateInspectionPdfUseCase } from '../../application/use-cases/generate-inspection-pdf.use-case';
import { GenerateReportQueryDto } from '../dto/generate-report-query.dto';

@Controller('banks/:bankId/inspection-requests')
@UseGuards(JwtAuthGuard, RolesGuard, BankMembershipGuard)
export class ReportController {
  constructor(
    private readonly generateInspectionPdfUseCase: GenerateInspectionPdfUseCase,
  ) {}

  @Get(':id/report/pdf')
  @Roles(
    Role.MANAGER,
    Role.REVIEWER,
    Role.SUPER_ADMIN,
    Role.SYSTEM_ADMIN,
    Role.USER,
    Role.VIEWER,
  )
  async downloadPdfReport(
    @Param('bankId', ParseUUIDPipe) bankId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GenerateReportQueryDto,
    @CurrentUser() user: { sub?: string; id?: string; role: Role },
    @Res() res: Response,
  ): Promise<void> {
    const actorId = (user.sub || user.id)!;

    const result = await this.generateInspectionPdfUseCase.execute({
      bankId,
      inspectionId: id,
      actor: { id: actorId, role: user.role },
      lang: query.lang,
    });

    const isAttachment = query.download === 'true' || query.download === '1';
    const dispositionType = isAttachment ? 'attachment' : 'inline';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dispositionType}; filename="${result.filename}"`,
      'Content-Length': String(result.pdfBuffer.length),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Report-Id': result.reportId,
      'X-System-Id': result.systemId,
    });

    res.end(result.pdfBuffer);
  }
}
