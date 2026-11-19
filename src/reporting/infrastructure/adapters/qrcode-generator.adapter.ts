import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { IQrCodeGeneratorService } from '../../domain/interfaces/qr-code-generator.interface';

@Injectable()
export class QrCodeGeneratorAdapter implements IQrCodeGeneratorService {
  private readonly logger = new Logger(QrCodeGeneratorAdapter.name);

  async generateQrCodeDataUri(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to generate QR code for URL '${text}': ${(error as Error).message}`,
      );
      // Return a blank or fallback data URI in extreme failure so PDF rendering does not halt
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    }
  }
}
