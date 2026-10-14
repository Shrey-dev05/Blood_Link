'use client';

import React from 'react';
import { X, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passCode: string;
  facilityName: string;
  facilityAddress?: string;
  expiresAt: string;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  isOpen,
  onClose,
  passCode,
  facilityName,
  facilityAddress,
  expiresAt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Verified Donor Arrival Pass
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Show this QR code to the hospital triage desk camera upon arrival.
        </p>

        {/* Real Real-Time Generated QR Code Canvas */}
        <div className="my-5 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 inline-block shadow-sm">
          <div className="w-48 h-48 bg-white p-3 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center shadow-inner">
            <QRCodeSVG
              value={passCode}
              size={170}
              level="H"
              includeMargin={false}
              fgColor="#991b1b"
            />
          </div>
        </div>

        {/* Short Pass Code for Manual Fallback */}
        <div className="bg-slate-100/80 rounded-xl p-3 mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
            Pass Code (Fallback)
          </span>
          <span className="text-2xl font-mono font-black text-blood-700 tracking-widest">
            {passCode}
          </span>
        </div>

        {/* Facility Details */}
        <div className="text-xs text-left bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-slate-700 space-y-1.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blood-700 block">Assigned Facility</span>
              <strong className="text-slate-900 text-sm">{facilityName}</strong>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              Verified
            </span>
          </div>
          {facilityAddress && (
            <p className="text-[11px] text-slate-500 line-clamp-2">{facilityAddress}</p>
          )}
          <div className="flex items-center text-slate-500 text-[11px] font-medium pt-1 border-t border-rose-100">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span>Valid Until: {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-900/10 transition-colors"
        >
          Done / Save to Device
        </button>
      </div>
    </div>
  );
};
