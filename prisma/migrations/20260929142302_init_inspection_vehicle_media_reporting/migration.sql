-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CaptureSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "Module" AS ENUM ('IDENTITY', 'INSPECTION', 'VEHICLE', 'MEDIA', 'BANK', 'REPORTING');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('STANDARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GeneratedReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'CSV', 'XLSX');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INSPECTION', 'SOLD', 'EXPIRED', 'DELETED');

-- CreateTable
CREATE TABLE "inspection_assignments" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "representativeId" UUID NOT NULL,
    "assignedBy" UUID NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectedReason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capture_sessions" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "representativeId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "CaptureSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "capture_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "checklistId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "inputType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklists" (
    "id" UUID NOT NULL,
    "vehicleCategoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_checklist_items" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "checklistItemId" UUID NOT NULL,
    "value" TEXT,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "inspection_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_value_decisions" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "estimatedValue" DECIMAL(12,2) NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "notes" TEXT,
    "rejectedReason" TEXT,
    "reviewerId" UUID NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_value_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_requests" (
    "id" UUID NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "bankId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "assignedRepresentativeId" UUID,
    "assignedReviewerId" UUID,
    "currentStatus" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "InspectionPriority" NOT NULL DEFAULT 'MEDIUM',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "address" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_status_history" (
    "id" UUID NOT NULL,
    "inspectionRequestId" UUID NOT NULL,
    "fromStatus" "InspectionStatus",
    "toStatus" "InspectionStatus" NOT NULL,
    "changedBy" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "media_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "captureSessionId" UUID,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileHash" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_report_parameters" (
    "id" UUID NOT NULL,
    "generatedReportId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "generated_report_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL,
    "reportId" UUID,
    "templateId" UUID,
    "generatedById" UUID NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT,
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "status" "GeneratedReportStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_parameters" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "report_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportType" NOT NULL DEFAULT 'STANDARD',
    "status" "ReportStatus" NOT NULL DEFAULT 'ACTIVE',
    "format" "ReportFormat" NOT NULL DEFAULT 'PDF',
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "frequency" "ScheduleFrequency" NOT NULL,
    "cronExpression" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "module" "Module" NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT,

    CONSTRAINT "colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "fuel_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmission_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "transmission_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "vin" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "manufactureYear" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "engineNumber" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "brandId" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "fuelTypeId" UUID NOT NULL,
    "transmissionTypeId" UUID NOT NULL,
    "colorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_assignments_inspectionRequestId_idx" ON "inspection_assignments"("inspectionRequestId");

-- CreateIndex
CREATE INDEX "inspection_assignments_representativeId_idx" ON "inspection_assignments"("representativeId");

-- CreateIndex
CREATE INDEX "inspection_assignments_assignedBy_idx" ON "inspection_assignments"("assignedBy");

-- CreateIndex
CREATE INDEX "capture_sessions_inspectionRequestId_idx" ON "capture_sessions"("inspectionRequestId");

-- CreateIndex
CREATE INDEX "capture_sessions_representativeId_idx" ON "capture_sessions"("representativeId");

-- CreateIndex
CREATE INDEX "checklist_items_checklistId_idx" ON "checklist_items"("checklistId");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_checklistId_code_key" ON "checklist_items"("checklistId", "code");

-- CreateIndex
CREATE INDEX "checklists_vehicleCategoryId_idx" ON "checklists"("vehicleCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_checklist_items_inspectionRequestId_checklistIte_key" ON "inspection_checklist_items"("inspectionRequestId", "checklistItemId");

-- CreateIndex
CREATE INDEX "marketing_value_decisions_inspectionRequestId_idx" ON "marketing_value_decisions"("inspectionRequestId");

-- CreateIndex
CREATE INDEX "marketing_value_decisions_reviewerId_idx" ON "marketing_value_decisions"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_requests_requestNumber_key" ON "inspection_requests"("requestNumber");

-- CreateIndex
CREATE INDEX "inspection_requests_bankId_idx" ON "inspection_requests"("bankId");

-- CreateIndex
CREATE INDEX "inspection_requests_vehicleId_idx" ON "inspection_requests"("vehicleId");

-- CreateIndex
CREATE INDEX "inspection_requests_customerId_idx" ON "inspection_requests"("customerId");

-- CreateIndex
CREATE INDEX "inspection_requests_assignedRepresentativeId_idx" ON "inspection_requests"("assignedRepresentativeId");

-- CreateIndex
CREATE INDEX "inspection_requests_assignedReviewerId_idx" ON "inspection_requests"("assignedReviewerId");

-- CreateIndex
CREATE INDEX "inspection_requests_createdBy_idx" ON "inspection_requests"("createdBy");

-- CreateIndex
CREATE INDEX "inspection_requests_currentStatus_priority_idx" ON "inspection_requests"("currentStatus", "priority");

-- CreateIndex
CREATE INDEX "inspection_status_history_inspectionRequestId_idx" ON "inspection_status_history"("inspectionRequestId");

-- CreateIndex
CREATE INDEX "inspection_status_history_changedBy_idx" ON "inspection_status_history"("changedBy");

-- CreateIndex
CREATE UNIQUE INDEX "media_categories_name_key" ON "media_categories"("name");

-- CreateIndex
CREATE INDEX "media_categoryId_idx" ON "media"("categoryId");

-- CreateIndex
CREATE INDEX "media_uploadedById_idx" ON "media"("uploadedById");

-- CreateIndex
CREATE INDEX "media_captureSessionId_idx" ON "media"("captureSessionId");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "generated_report_parameters_generatedReportId_idx" ON "generated_report_parameters"("generatedReportId");

-- CreateIndex
CREATE UNIQUE INDEX "generated_report_parameters_generatedReportId_key_key" ON "generated_report_parameters"("generatedReportId", "key");

-- CreateIndex
CREATE INDEX "generated_reports_reportId_idx" ON "generated_reports"("reportId");

-- CreateIndex
CREATE INDEX "generated_reports_templateId_idx" ON "generated_reports"("templateId");

-- CreateIndex
CREATE INDEX "generated_reports_generatedById_idx" ON "generated_reports"("generatedById");

-- CreateIndex
CREATE INDEX "generated_reports_status_idx" ON "generated_reports"("status");

-- CreateIndex
CREATE INDEX "report_parameters_reportId_idx" ON "report_parameters"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_parameters_reportId_key_key" ON "report_parameters"("reportId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "reports_code_key" ON "reports"("code");

-- CreateIndex
CREATE INDEX "reports_createdBy_idx" ON "reports"("createdBy");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "report_schedules_reportId_idx" ON "report_schedules"("reportId");

-- CreateIndex
CREATE INDEX "report_schedules_createdBy_idx" ON "report_schedules"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brands_code_key" ON "vehicle_brands"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_categories_code_key" ON "vehicle_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "colors_name_key" ON "colors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_types_name_key" ON "fuel_types"("name");

-- CreateIndex
CREATE INDEX "vehicle_models_brandId_idx" ON "vehicle_models"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "transmission_types_name_key" ON "transmission_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");

-- CreateIndex
CREATE INDEX "vehicles_brandId_idx" ON "vehicles"("brandId");

-- CreateIndex
CREATE INDEX "vehicles_modelId_idx" ON "vehicles"("modelId");

-- CreateIndex
CREATE INDEX "vehicles_categoryId_idx" ON "vehicles"("categoryId");

-- CreateIndex
CREATE INDEX "vehicles_fuelTypeId_idx" ON "vehicles"("fuelTypeId");

-- CreateIndex
CREATE INDEX "vehicles_transmissionTypeId_idx" ON "vehicles"("transmissionTypeId");

-- CreateIndex
CREATE INDEX "vehicles_colorId_idx" ON "vehicles"("colorId");

-- AddForeignKey
ALTER TABLE "inspection_assignments" ADD CONSTRAINT "inspection_assignments_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_assignments" ADD CONSTRAINT "inspection_assignments_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_assignments" ADD CONSTRAINT "inspection_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capture_sessions" ADD CONSTRAINT "capture_sessions_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capture_sessions" ADD CONSTRAINT "capture_sessions_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_vehicleCategoryId_fkey" FOREIGN KEY ("vehicleCategoryId") REFERENCES "vehicle_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_checklist_items" ADD CONSTRAINT "inspection_checklist_items_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_checklist_items" ADD CONSTRAINT "inspection_checklist_items_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "checklist_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_value_decisions" ADD CONSTRAINT "marketing_value_decisions_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_value_decisions" ADD CONSTRAINT "marketing_value_decisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_assignedRepresentativeId_fkey" FOREIGN KEY ("assignedRepresentativeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_assignedReviewerId_fkey" FOREIGN KEY ("assignedReviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_status_history" ADD CONSTRAINT "inspection_status_history_inspectionRequestId_fkey" FOREIGN KEY ("inspectionRequestId") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_status_history" ADD CONSTRAINT "inspection_status_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "media_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_captureSessionId_fkey" FOREIGN KEY ("captureSessionId") REFERENCES "capture_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_report_parameters" ADD CONSTRAINT "generated_report_parameters_generatedReportId_fkey" FOREIGN KEY ("generatedReportId") REFERENCES "generated_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_parameters" ADD CONSTRAINT "report_parameters_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "vehicle_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "fuel_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_transmissionTypeId_fkey" FOREIGN KEY ("transmissionTypeId") REFERENCES "transmission_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "colors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
