import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';

const SCAN_CONFIG: Html5QrcodeCameraScanConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  disableFlip: true,
};

export interface CameraDevice {
  id: string;
  label: string;
}

export interface StartScannerOptions {
  elementId: string;
  /** If set, opens this device; otherwise uses `facingMode: 'environment'`. */
  cameraId?: string | null;
  onSuccess: (decodedText: string) => void;
  onError?: (error: string) => void;
}

/** Higher score = prefer for QR scanning (rear / world-facing). */
export function cameraPreferenceScore(label: string): number {
  const l = label.toLowerCase();
  if (
    /back|rear|wide|ultra|tele|environment|world facing|facing back|outer|rück/i.test(l)
  ) {
    return 100;
  }
  if (/front|selfie|user|facetime|facing front|inner|frontkamera/i.test(l)) {
    return 10;
  }
  return 50;
}

export function sortCamerasForQrScan(cameras: CameraDevice[]): CameraDevice[] {
  return [...cameras].sort((a, b) => {
    const diff = cameraPreferenceScore(b.label) - cameraPreferenceScore(a.label);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label);
  });
}

const STORAGE_KEY = 'tagly_preferred_camera_id';

export function getStoredPreferredCameraId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storePreferredCameraId(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

export function resolveInitialCameraIndex(sortedCameras: CameraDevice[]): number {
  if (sortedCameras.length === 0) return 0;
  const saved = getStoredPreferredCameraId();
  if (!saved) return 0;
  const idx = sortedCameras.findIndex((c) => c.id === saved);
  return idx >= 0 ? idx : 0;
}

export class QRScannerService {
  private scanner: Html5Qrcode | null = null;

  /** Lists video inputs via enumerateDevices only (no getUserMedia — avoids duplicate iOS prompts). */
  static async listCameras(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.warn('[Scanner] enumerateDevices not available');
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs: CameraDevice[] = [];
      for (const d of devices) {
        if (d.kind !== 'videoinput' || !d.deviceId) continue;
        videoInputs.push({
          id: d.deviceId,
          label: (d.label && d.label.trim()) || d.deviceId,
        });
      }
      return videoInputs;
    } catch (e) {
      console.warn('[Scanner] Enumerating cameras failed', e);
      return [];
    }
  }

  async start(options: StartScannerOptions): Promise<void> {
    await this.stop();
    this.scanner = new Html5Qrcode(options.elementId);
    const cameraConfig = options.cameraId
      ? { deviceId: { exact: options.cameraId } }
      : { facingMode: 'environment' as const };

    await this.scanner.start(
      cameraConfig,
      SCAN_CONFIG,
      (decodedText) => options.onSuccess(decodedText),
      () => {},
    );
  }

  async stop(): Promise<void> {
    if (this.scanner?.isScanning) {
      try {
        await this.scanner.stop();
      } catch (e) {
        console.warn('[Scanner] stop()', e);
      }
    }
    this.scanner = null;
  }
}
