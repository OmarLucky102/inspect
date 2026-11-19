export const QR_CODE_GENERATOR_SERVICE = Symbol('QR_CODE_GENERATOR_SERVICE');

export interface IQrCodeGeneratorService {
  generateQrCodeDataUri(text: string): Promise<string>;
}
