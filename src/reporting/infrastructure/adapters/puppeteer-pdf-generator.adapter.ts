import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { IPdfGeneratorService } from '../../domain/interfaces/pdf-generator.interface';

@Injectable()
export class PuppeteerPdfGeneratorAdapter implements IPdfGeneratorService {
  private readonly logger = new Logger(PuppeteerPdfGeneratorAdapter.name);

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
      if (fs.existsSync('/usr/bin/chromium')) {
        executablePath = '/usr/bin/chromium';
      } else if (fs.existsSync('/usr/bin/chromium-browser')) {
        executablePath = '/usr/bin/chromium-browser';
      }
    }

    // Use dynamic import to support ESM puppeteer in CommonJS environment
    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;

    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--font-render-hinting=medium',
      ],
    });

    try {
      const page = await browser.newPage();

      // Configure viewport to standard A4 ratio
      await page.setViewport({
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
        deviceScaleFactor: 2, // High-DPI for crisp text and graphics
      });

      // Set content with waitUntil to ensure inline fonts/images are ready
      await page.setContent(html, {
        waitUntil: ['load'],
        timeout: 30000,
      });

      await page.emulateMediaType('print');

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfUint8Array);
    } catch (error) {
      this.logger.error(
        `Puppeteer PDF generation failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await browser.close().catch((err: Error) => {
        this.logger.warn(`Failed to cleanly close browser: ${err.message}`);
      });
    }
  }
}
