export const PDF_GENERATOR_SERVICE = Symbol('PDF_GENERATOR_SERVICE');

export interface IPdfGeneratorService {
  generatePdfFromHtml(html: string): Promise<Buffer>;
}
