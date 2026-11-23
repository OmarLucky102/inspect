import { PuppeteerPdfGeneratorAdapter } from './puppeteer-pdf-generator.adapter';

describe('PuppeteerPdfGeneratorAdapter', () => {
  let adapter: PuppeteerPdfGeneratorAdapter;
  let mockBrowser: any;
  let mockPage: any;
  let disconnectCallback: (() => void) | null = null;

  beforeEach(() => {
    mockPage = {
      setViewport: jest.fn().mockResolvedValue(undefined),
      setContent: jest.fn().mockResolvedValue(undefined),
      evaluateHandle: jest.fn().mockResolvedValue(undefined),
      emulateMediaType: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])), // %PDF
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      connected: true,
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'disconnected') {
          disconnectCallback = cb;
        }
      }),
    };

    adapter = new PuppeteerPdfGeneratorAdapter();
    // Directly inject mockBrowser to verify instance caching and page lifecycle
    (adapter as any).browser = mockBrowser;
  });

  afterEach(async () => {
    await adapter.onApplicationShutdown();
  });

  it('should reuse persistent browser instance across multiple PDF requests', async () => {
    const html = '<html><body>Test Report</body></html>';

    const result1 = await adapter.generatePdfFromHtml(html);
    const result2 = await adapter.generatePdfFromHtml(html);

    expect(result1).toBeInstanceOf(Buffer);
    expect(result2).toBeInstanceOf(Buffer);
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    expect(mockPage.close).toHaveBeenCalledTimes(2);
    expect(mockBrowser.close).not.toHaveBeenCalled();
  });

  it('should configure deviceScaleFactor to 1 and wait for document.fonts.ready', async () => {
    await adapter.generatePdfFromHtml('<html><body>Test</body></html>');

    expect(mockPage.setViewport).toHaveBeenCalledWith({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });
    expect(mockPage.evaluateHandle).toHaveBeenCalledWith('document.fonts.ready');
  });

  it('should close page even if pdf generation throws an error', async () => {
    mockPage.pdf.mockRejectedValueOnce(new Error('PDF generation crashed'));

    await expect(
      adapter.generatePdfFromHtml('<html><body>Test</body></html>'),
    ).rejects.toThrow('PDF generation crashed');

    expect(mockPage.close).toHaveBeenCalledTimes(1);
    expect(mockBrowser.close).not.toHaveBeenCalled();
  });

  it('should reset browser reference on disconnected event', async () => {
    (adapter as any).attachBrowserListeners(mockBrowser);
    expect((adapter as any).browser).toBe(mockBrowser);

    if (disconnectCallback) {
      disconnectCallback();
    }

    expect((adapter as any).browser).toBeNull();
  });

  it('should cleanly close browser on application shutdown', async () => {
    await adapter.onApplicationShutdown();

    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    expect((adapter as any).browser).toBeNull();
  });
});
