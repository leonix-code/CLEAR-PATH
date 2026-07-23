declare module 'html5-qrcode' {
  interface Html5QrcodeConfig {
    fps?: number;
    qrbox?: { width: number; height: number } | number;
    aspectRatio?: number;
  }

  interface QrCodeResult {
    decodedText: string;
    result: any;
  }

  export class Html5Qrcode {
    constructor(elementId: string);
    start(
      cameraIdOrConfig: { facingMode: string } | string,
      config: Html5QrcodeConfig,
      onSuccess: (decodedText: string, result?: QrCodeResult) => void,
      onError?: (errorMessage: string) => void
    ): Promise<void>;
    stop(): Promise<void>;
    pause(): void;
    resume(): void;
    getState(): number;
    static getCameras(): Promise<Array<{ id: string; label: string }>>;
  }

  export enum Html5QrcodeSupportedFormats {
    QR_CODE = 0,
    AZTEC = 1,
    DATA_MATRIX = 2,
    MAXICODE = 3,
  }
}
