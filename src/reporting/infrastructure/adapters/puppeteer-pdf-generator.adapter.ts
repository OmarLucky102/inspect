import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import * as fs from 'fs';
import { IPdfGeneratorService } from '../../domain/interfaces/pdf-generator.interface';

@Injectable()
export class PuppeteerPdfGeneratorAdapter
  implements IPdfGeneratorService, OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(PuppeteerPdfGeneratorAdapter.name);
  private browser: any | null = null;
  private browserInitPromise: Promise<any> | null = null;

  onModuleInit(): void {
    // Non-blocking warmup in background so application starts and passes healthchecks immediately
    this.getBrowser().catch((error) => {
      this.logger.warn(
        `Pre-warming Chromium browser deferred: ${(error as Error).message}`,
      );
    });
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.browser) {
      this.logger.log('Closing persistent Chromium browser...');
      try {
        await this.browser.close();
      } catch (err) {
        this.logger.warn(`Failed to cleanly close browser: ${(err as Error).message}`);
      } finally {
        this.browser = null;
        this.browserInitPromise = null;
      }
    }
  }

  private async getBrowser(): Promise<any> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.browserInitPromise) {
      return this.browserInitPromise;
    }

    this.browserInitPromise = (async () => {
      try {
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

        this.attachBrowserListeners(browser);
        this.browser = browser;
        this.logger.log('Persistent Chromium browser initialized successfully.');
        return browser;
      } catch (error) {
        this.logger.error(
          `Failed to launch Chromium browser: ${(error as Error).message}`,
        );
        this.browser = null;
        throw error;
      } finally {
        this.browserInitPromise = null;
      }
    })();

    return this.browserInitPromise;
  }

  private attachBrowserListeners(browser: any): void {
    if (!browser || typeof browser.on !== 'function') return;
    browser.on('disconnected', () => {
      this.logger.warn(
        'Persistent Chromium browser disconnected. Resetting instance.',
      );
      this.browser = null;
      this.browserInitPromise = null;
    });
  }

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configure viewport to standard A4 ratio, scale factor 1 for lightweight rendering
      await page.setViewport({
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
        deviceScaleFactor: 1, // Native 1:1 scale for optimized file size
      });

      // Set content with waitUntil to ensure inline fonts/images are ready
      await page.setContent(html, {
        waitUntil: ['load'],
        timeout: 30000,
      });

      // Ensure document fonts are loaded before generating PDF
      await page.evaluateHandle('document.fonts.ready');

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
      await page.close().catch((err: Error) => {
        this.logger.warn(`Failed to cleanly close page: ${err.message}`);
      });
    }
  }
}
