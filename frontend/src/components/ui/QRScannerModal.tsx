'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, CheckCircle2, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => Promise<void>;
  scanning: boolean;
  scanResult: any;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  scanning,
  scanResult
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'interactive-camera-qr-reader';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      // Small timeout to allow DOM element to render
      await new Promise(r => setTimeout(r, 150));
      const el = document.getElementById(containerId);
      if (!el) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraError('No webcam or back camera detected on this device. You can type the pass code below.');
        setMode('manual');
        return;
      }

      // Prefer back camera if available, otherwise first camera
      const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          // Play a slight beep or handle success
          stopCamera();
          await onScanSuccess(decodedText.trim());
        },
        () => {
          // QR code not found in current frame, ignore
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions or enter code manually.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // ignore error on stop
      }
      setIsCameraActive(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await onScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blood-100 text-blood-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Verify Donor Arrival Pass</h3>
              <p className="text-xs text-slate-500">Scan digital QR code or enter alphanumeric code</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 flex space-x-2">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
              mode === 'camera'
                ? 'bg-blood-700 text-white border-blood-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setMode('manual');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 border transition-all ${
              mode === 'manual'
                ? 'bg-blood-700 text-white border-blood-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Code Entry</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {mode === 'camera' ? (
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[260px] flex items-center justify-center border-2 border-slate-700">
                <div id={containerId} className="w-full h-full min-h-[260px]"></div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 text-white p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => setMode('manual')}
                      className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100"
                    >
                      Enter Code Manually
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Point camera directly at the donor's digital QR Pass screen
              </p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Donation Pass Code (e.g. RR-9821)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="RR-XXXX"
                    className="flex-1 uppercase font-mono tracking-wider font-bold text-base px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blood-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={scanning || !manualCode.trim()}
                    className="px-5 py-2.5 bg-blood-700 hover:bg-blood-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Verify</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Verification Result Feedback */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border ${
                scanResult.valid
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              } animate-in fade-in duration-200`}
            >
              <div className="flex items-start space-x-3">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-2 flex-1">
                  <div>
                    <p className="font-black text-sm text-emerald-900">
                      {scanResult.valid ? '✅ Donor Arrival Pass Verified!' : '❌ Verification Denied'}
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{scanResult.message}</p>
                  </div>

                  {scanResult.valid && (
                    <div className="space-y-3 pt-1">
                      {/* High-visibility Bed & Department Routing Banner */}
                      <div className="p-3.5 bg-white rounded-xl border-2 border-emerald-500 shadow-sm space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                            Patient Routing Assignment
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {scanResult.patient_case_ref}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination Dept</span>
                            <span className="text-xs font-black text-slate-900 block mt-0.5">
                              {scanResult.department || scanResult.destination_dept || 'Trauma Resuscitation Unit'}
                            </span>
                          </div>
                          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                            <span className="text-[10px] font-bold text-rose-600 uppercase block">Bed Location</span>
                            <span className="text-sm font-black text-blood-700 block mt-0.5">
                              {scanResult.bed_number || 'ICU Bed #3'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-900 font-semibold flex items-center space-x-1.5">
                          <span>👉</span>
                          <span>
                            {scanResult.routing_instructions || `Direct donor immediately to ${scanResult.destination_dept || 'Trauma Unit'} for clinical screening.`}
                          </span>
                        </div>
                      </div>

                      {/* Donor Profile Snapshot */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 bg-emerald-100/50 p-2.5 rounded-xl">
                        <div>
                          Donor Code: <strong className="text-emerald-900 block font-mono">{scanResult.donor_code}</strong>
                        </div>
                        <div>
                          Blood Group: <strong className="text-emerald-900 block font-mono text-xs">{scanResult.blood_group}</strong>
                        </div>
                        <div>
                          Required: <strong className="text-emerald-900 block">{scanResult.component?.toUpperCase() || 'PRBC'}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
