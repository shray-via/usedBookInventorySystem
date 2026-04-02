import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine } from 'lucide-react';

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'];

export default function ScannerPanel({ open, onToggle, onDetected }) {
  const [manualCode, setManualCode] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [active, setActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const stopScanner = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setActive(false);
    };

    const bootScanner = async () => {
      if (!open) {
        stopScanner();
        return;
      }
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setScannerError('Camera needs HTTPS/secure context. Use manual ISBN entry in this session.');
        return;
      }
      if (!('BarcodeDetector' in window)) {
        setScannerError('Camera scan is not supported in this browser. Use manual ISBN entry.');
        return;
      }

      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const usableFormats = BARCODE_FORMATS.filter((format) => supported.includes(format));
        if (usableFormats.length === 0) {
          setScannerError('Barcode format not supported in this browser. Use manual ISBN entry.');
          return;
        }
        const detector = new window.BarcodeDetector({ formats: usableFormats });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!videoRef.current) return;
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);
        setScannerError('');

        const scanFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            frameRef.current = requestAnimationFrame(scanFrame);
            return;
          }
          try {
            const detections = await detector.detect(videoRef.current);
            if (detections.length > 0) {
              const code = detections[0]?.rawValue?.trim();
              if (code) {
                onDetected(code);
                stopScanner();
                return;
              }
            }
          } catch {
            setScannerError('Camera is on, but scan failed. Try manual ISBN entry.');
          }
          frameRef.current = requestAnimationFrame(scanFrame);
        };

        frameRef.current = requestAnimationFrame(scanFrame);
      } catch {
        setScannerError('Camera permission denied or unavailable. Use manual ISBN entry.');
      }
    };

    bootScanner();
    return () => stopScanner();
  }, [onDetected, open]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    if (!manualCode.trim()) return;
    onDetected(manualCode.trim());
    setManualCode('');
  };

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-ink-800">Scan ISBN / QR</h3>
          <p className="mt-1 text-base text-ink-600">Fastest path: open camera, point to code, done.</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {open ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </button>
      </div>

      <form onSubmit={handleManualSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-2 block text-base font-semibold text-ink-700">Or type/paste code</span>
          <input
            className="min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-base outline-none"
            placeholder="9780307277671 or QR payload"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-accent-600 px-5 py-2 text-base font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <ScanLine className="h-5 w-5" />
          Lookup Code
        </button>
      </form>

      {open && (
        <div className="mt-4 overflow-hidden rounded-xl border border-brand-200 bg-black/90">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
      )}

      <p className="mt-3 text-base text-ink-600">
        {open && active ? 'Camera scanner is active. Point at ISBN barcode or QR code.' : 'Scanner is off.'}
      </p>
      {!!scannerError && <p className="mt-1 text-base font-medium text-red-600">{scannerError}</p>}
    </section>
  );
}
