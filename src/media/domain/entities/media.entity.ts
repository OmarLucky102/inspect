import { MediaStatus } from '@prisma/client';

export interface MediaProps {
  id: string;
  categoryId: string;
  uploadedById: string;
  captureSessionId: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  fileHash: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  sortOrder: number;
  status: MediaStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class Media {
  private props: MediaProps;

  constructor(props: MediaProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get uploadedById(): string {
    return this.props.uploadedById;
  }

  get captureSessionId(): string | null {
    return this.props.captureSessionId;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get fileUrl(): string {
    return this.props.fileUrl;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get fileHash(): string | null {
    return this.props.fileHash;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get duration(): number | null {
    return this.props.duration;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get status(): MediaStatus {
    return this.props.status;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Domain Business Rules
  public markUploaded(): void {
    this.props.status = MediaStatus.UPLOADED;
    this.props.failureReason = null;
    this.props.updatedAt = new Date();
  }

  public markUploadedWithDetails(details: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    fileName?: string;
  }): void {
    this.props.width = details.width;
    this.props.height = details.height;
    this.props.fileSize = details.fileSize;
    this.props.mimeType = details.mimeType;
    if (details.fileName) {
      this.props.fileName = details.fileName;
    }
    this.props.status = MediaStatus.UPLOADED;
    this.props.failureReason = null;
    this.props.updatedAt = new Date();
  }

  public markFailed(reason: string): void {
    this.props.status = MediaStatus.FAILED;
    this.props.failureReason = reason;
    this.props.updatedAt = new Date();
  }

  public markDeleted(): void {
    this.props.status = MediaStatus.DELETED;
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }
}
