import { Html5Qrcode } from 'html5-qrcode';

export interface ScannerConfig {
  elementId: string;
  onSuccess: (guid: string) => void;
  onError?: (error: string) => void;
}

export class QRScannerService {
  private scanner: Html5Qrcode | null = null;

  async start(config: ScannerConfig): Promise<void> {
    this.scanner = new Html5Qrcode(config.elementId);
    await this.scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => config.onSuccess(decodedText),
      () => {},
    );
  }

  async stop(): Promise<void> {
    if (this.scanner?.isScanning) {
      await this.scanner.stop();
    }
    this.scanner = null;
  }
}
