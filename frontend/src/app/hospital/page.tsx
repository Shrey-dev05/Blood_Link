'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Plus, QrCode, Search, AlertCircle, Clock, 
  CheckCircle2, Phone, RefreshCw, Layers, ShieldCheck, X, Users,
  Heart, Check, ArrowRight, Activity, Camera
} from 'lucide-react';
import { api } from '@/lib/api';
import { BloodRequest } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QRScannerModal } from '@/components/ui/QRScannerModal';

export default function HospitalDashboard() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');

  // QR Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  // Outcome / Fulfillment Modal
  const [isFulfillmentOpen, setIsFulfillmentOpen] = useState(false);
  const [fulfilledUnits, setFulfilledUnits] = useState(1);
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');

  // Clinical Screening Modal
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [screeningDonorId, setScreeningDonorId] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('ELIGIBLE');
  const [barcodeInput, setBarcodeInput] = useState('');

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data);
      if (selectedRequest) {
        const updated = data.find((r: BloodRequest) => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      } else if (data.length > 0) {
        setSelectedRequest(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleValidateQR = async (code: string) => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.validateQR(code.trim());
      setScanResult(res);
      await loadRequests();
    } catch (err: any) {
      setScanResult({ valid: false, message: err.message || 'Validation failed. Pass expired or invalid.' });
    } finally {
      setScanning(false);
    }
  };

  const handleRecordScreening = async () => {
    if (!selectedRequest || !screeningDonorId) return;
    try {
      await api.recordScreening(selectedRequest.id, screeningDonorId, screeningStatus);
      if (screeningStatus === 'ELIGIBLE' && barcodeInput.trim()) {
        await api.recordDonationOutcome(selectedRequest.id, screeningDonorId, barcodeInput.trim(), 1);
      }
      setIsScreeningOpen(false);
      loadRequests();
      alert(`Clinical workflow successfully logged for donor!`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleConfirmFulfillment = async () => {
    if (!selectedRequest) return;
    try {
      await api.confirmFulfillment(selectedRequest.id, Number(fulfilledUnits), fulfillmentNotes);
      setIsFulfillmentOpen(false);
      loadRequests();
      alert(`Fulfillment recorded! Outstanding alerts reconciled.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filtered = requests.filter(r => filterUrgency === 'ALL' || r.urgency === filterUrgency);

  // Stats calculation
  const totalActive = requests.filter(r => r.status !== 'FULFILLED' && r.status !== 'CANCELLED').length;
  const totalFulfilled = requests.filter(r => r.status === 'FULFILLED').length;
  const p0Count = requests.filter(r => r.urgency === 'P0' && r.status !== 'FULFILLED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Hospital Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blood-700 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-900/20 shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Emergency Command</h1>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                Dr. B.R. Ambedkar Memorial Hospital Raipur
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active blood request management, camera QR verification & real-time donor status tracking.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setIsScannerOpen(true);
              setScanResult(null);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all transform hover:-translate-y-0.5"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Scan Donor QR Pass</span>
          </button>

          <Link
            href="/hospital/new"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Emergency Request</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Requests</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalActive}</span>
          <span className="text-[11px] text-blood-600 font-semibold mt-0.5 block">{p0Count} Critical P0 Pending</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fulfilled Cases</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalFulfilled}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Transfusions completed</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Family Tracker</span>
          <Link href="/patient" className="text-sm font-bold text-blood-700 hover:underline mt-2 flex items-center space-x-1">
            <span>Open Family View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Shareable live updates</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">QR Verification</span>
          <span className="text-sm font-bold text-slate-800 mt-2 block">Camera Enabled</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Zero Contact Verification</span>
        </div>
      </div>

      {/* Main Grid: Left Request List, Right Request Details & Match Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Request List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1.5 text-xs">
              {['ALL', 'P0', 'P1', 'P2'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterUrgency(tier)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    filterUrgency === tier
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-semibold">{filtered.length} Cases Listed</span>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">No Active Emergency Requests</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  All emergency blood requirements have been resolved or none have been submitted yet.
                </p>
                <Link
                  href="/hospital/new"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Raise Emergency Request</span>
                </Link>
              </div>
            ) : (
              filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-5 bg-white rounded-2xl border transition-all cursor-pointer ${
                    selectedRequest?.id === req.id
                      ? 'border-blood-600 ring-2 ring-blood-100 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={req.urgency} size="sm" />
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">{req.patient_case_ref}</span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-blood-700">{req.blood_group}</span>
                      <span className="text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {req.component}
                      </span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-slate-500">Needed: </span>
                      <strong className="text-slate-900 font-bold">{req.quantity_required} Units</strong>
                      <span className="block text-[11px] text-emerald-600 font-semibold">
                        Fulfilled: {req.quantity_fulfilled}/{req.quantity_required}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="truncate max-w-[210px] font-medium text-slate-700">{req.destination_dept}</span>
                    <span className="font-mono text-[11px] text-rose-700 font-semibold">
                      Due: {new Date(req.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Selected Request Inspector & Parallel Branches (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-500">{selectedRequest.patient_case_ref}</span>
                    <StatusBadge status={selectedRequest.urgency} size="sm" />
                    <StatusBadge status={selectedRequest.status} size="sm" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    {selectedRequest.quantity_required} Units of {selectedRequest.blood_group} {selectedRequest.component.toUpperCase()}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRequest.destination_dept}</p>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsScreeningOpen(true)}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Clinical Screening
                  </button>
                  <button
                    onClick={() => setIsFulfillmentOpen(true)}
                    className="px-3.5 py-2 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Complete Fulfillment
                  </button>
                </div>
              </div>

              {/* Patient Family Tracking Link Bar */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Family Tracking is live for Case <strong>{selectedRequest.patient_case_ref}</strong>
                  </span>
                </div>
                <Link
                  href={`/patient?case=${selectedRequest.patient_case_ref}`}
                  className="font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 underline"
                >
                  <span>Family View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Confirmed & Accepted Blood Sources (Immediate Fulfillment Action) */}
              {(() => {
                const acceptedBanks = selectedRequest.matches.filter(m => m.source_type === 'blood_bank' && m.response_state === 'ACCEPTED');
                const acceptedDonors = selectedRequest.matches.filter(m => m.source_type === 'donor' && (m.response_state === 'ACCEPTED' || m.response_state === 'TRAVELLING' || m.response_state === 'ARRIVED_QR_VERIFIED'));
                const hasAcceptedSources = acceptedBanks.length > 0 || acceptedDonors.length > 0;

                if (!hasAcceptedSources) return null;

                return (
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50/70 border-2 border-emerald-400 rounded-3xl space-y-3 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping"></span>
                        <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                          Confirmed & Accepted Blood Sources
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full">
                        {acceptedBanks.length + acceptedDonors.length} Confirmed Contributor(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Accepted Blood Banks */}
                      {acceptedBanks.map((b) => (
                        <div key={b.id} className="p-3.5 bg-white rounded-2xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                Blood Bank Confirmed
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500">~{b.distance_km} km away</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{b.source_name}</h4>
                            <p className="text-xs text-slate-500">
                              {b.notes || `Agreed to supply ${b.units_offered} units for this emergency requirement.`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {b.contact_phone && (
                              <a
                                href={`tel:${b.contact_phone}`}
                                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Call {b.contact_phone}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Accepted Voluntary Donors */}
                      {acceptedDonors.map((d) => (
                        <div key={d.id} className="p-3.5 bg-white rounded-2xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                d.response_state === 'ARRIVED_QR_VERIFIED'
                                  ? 'bg-emerald-600 text-white'
                                  : d.response_state === 'TRAVELLING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {d.response_state === 'ARRIVED_QR_VERIFIED' ? '✅ Arrived & QR Verified' : d.response_state === 'TRAVELLING' ? '🚗 Donor En Route' : '🟢 Donor Accepted to Give Blood'}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500">~{d.distance_km} km away</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">{d.source_name}</h4>
                            <p className="text-xs text-slate-500">
                              {d.response_state === 'ARRIVED_QR_VERIFIED'
                                ? `Donor has arrived at hospital! Destination: ${selectedRequest.destination_dept}. Ready for clinical screening.`
                                : `Voluntary donor accepted request and generated arrival QR pass. Awaiting hospital triage check-in.`}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {d.response_state !== 'ARRIVED_QR_VERIFIED' ? (
                              <button
                                onClick={() => {
                                  setIsScannerOpen(true);
                                  setScanResult(null);
                                }}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
                              >
                                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Scan Donor QR Pass</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setScreeningDonorId(d.source_id);
                                  setIsScreeningOpen(true);
                                }}
                                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Start Clinical Screening</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Parallel Matching Dual Branches */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blood-600" />
                    <span>Parallel Matching Results</span>
                  </h3>
                  <span className="text-xs text-slate-400">Escalation: <strong>{selectedRequest.escalation_stage}</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branch A: Blood Bank Inventory */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Branch A: Regional Blood Banks (&lt; 5km)</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inventory</span>
                    </div>

                    {selectedRequest.matches.filter(m => m.source_type === 'blood_bank').length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Searching blood banks within 5 km radius...</p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedRequest.matches.filter(m => m.source_type === 'blood_bank').map((m) => {
                          const isAccepted = m.response_state === 'ACCEPTED';
                          return (
                            <div
                              key={m.id}
                              className={`p-3 bg-white rounded-xl border text-xs space-y-1.5 transition-all ${
                                isAccepted ? 'border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50/40 shadow-xs' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-900 font-semibold">{m.source_name}</strong>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isAccepted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isAccepted ? 'ACCEPTED TO SUPPLY' : m.response_state}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{m.notes}</p>
                              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 border-t border-slate-100">
                                <span>Distance: <strong>{m.distance_km} km</strong></span>
                                <span className={isAccepted ? 'text-emerald-700 font-black' : 'text-slate-700 font-semibold'}>
                                  {m.units_offered} units {isAccepted ? 'Confirmed' : 'Offered'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Branch B: Consenting Donors */}
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Branch B: Voluntary Donors</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blood-700">Live Leads</span>
                    </div>

                    {selectedRequest.matches.filter(m => m.source_type === 'donor').length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Broadcasting to voluntary donors statewide...</p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedRequest.matches.filter(m => m.source_type === 'donor').map((m) => {
                          const isAccepted = m.response_state === 'ACCEPTED' || m.response_state === 'TRAVELLING' || m.response_state === 'ARRIVED_QR_VERIFIED';
                          return (
                            <div
                              key={m.id}
                              className={`p-3 bg-white rounded-xl border text-xs space-y-1.5 shadow-sm transition-all ${
                                isAccepted ? 'border-emerald-400 ring-1 ring-emerald-200 bg-emerald-50/40' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-900 font-semibold">{m.source_name}</strong>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  m.response_state === 'ARRIVED_QR_VERIFIED'
                                    ? 'bg-emerald-600 text-white'
                                    : m.response_state === 'ACCEPTED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : m.response_state === 'TRAVELLING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {m.response_state === 'ARRIVED_QR_VERIFIED'
                                    ? 'ARRIVED & VERIFIED'
                                    : m.response_state === 'ACCEPTED'
                                    ? 'ACCEPTED TO DONATE'
                                    : m.response_state}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">{m.notes}</p>
                              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 border-t border-slate-100">
                                <span>Distance: <strong>~{m.distance_km} km</strong></span>
                                <span className={isAccepted ? 'text-emerald-700 font-black' : 'text-blood-700 font-semibold'}>
                                  {isAccepted ? '1 Donor Accepted' : '1 Donor Ready'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Event Timeline */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Live Event Timeline
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedRequest.events.map((evt) => (
                    <div key={evt.id} className="flex items-start space-x-2.5 text-xs text-slate-600 p-2.5 rounded-xl bg-slate-50">
                      <span className="w-2 h-2 rounded-full bg-blood-600 mt-1.5 shrink-0"></span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-semibold">{evt.event_type}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{evt.reason}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">By {evt.actor_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              Select a request from the left list to view details.
            </div>
          )}
        </div>
      </div>

      {/* Camera & Manual QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleValidateQR}
        scanning={scanning}
        scanResult={scanResult}
      />

      {/* Clinical Screening & Bag ID Modal */}
      {isScreeningOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Clinical Screening & Phlebotomy</h3>
              <button onClick={() => setIsScreeningOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select arrived donor, record medical suitability outcome, and assign official blood bag barcode ID.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Arrived Donor Candidate</label>
                <select
                  value={screeningDonorId}
                  onChange={(e) => setScreeningDonorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-blood-500"
                >
                  <option value="">-- Choose Donor Candidate --</option>
                  {selectedRequest.matches.filter(m => m.source_type === 'donor').map((d) => (
                    <option key={d.source_id} value={d.source_id}>
                      {d.source_name} ({d.response_state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Screening Outcome</label>
                <select
                  value={screeningStatus}
                  onChange={(e) => setScreeningStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-white focus:ring-2 focus:ring-blood-500"
                >
                  <option value="ELIGIBLE">Eligible to Proceed (Passed Vitals & Hb)</option>
                  <option value="DEFERRED_TEMPORARY">Deferred Temporary (Low Hb / Vitals)</option>
                  <option value="DEFERRED_PERMANENT">Deferred Permanent</option>
                </select>
              </div>

              {screeningStatus === 'ELIGIBLE' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Blood Bag Barcode ID</label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. AMBEDKAR-BAG-2026-8812"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-blood-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Maintains hospital laboratory traceability separate from donor QR pass.
                  </span>
                </div>
              )}

              <button
                onClick={handleRecordScreening}
                disabled={!screeningDonorId}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Save Clinical Screening & Phlebotomy Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Fulfillment Modal */}
      {isFulfillmentOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Confirm Request Fulfillment</h3>
              <button onClick={() => setIsFulfillmentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Confirm units secured and update RescueFlow status. Upon full fulfillment, all pending alerts for other donors will be cancelled.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Units Confirmed Received</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRequest.quantity_required}
                  value={fulfilledUnits}
                  onChange={(e) => setFulfilledUnits(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Outcome / Transfusion Notes</label>
                <textarea
                  value={fulfillmentNotes}
                  onChange={(e) => setFulfillmentNotes(e.target.value)}
                  placeholder="Cross-match verified, unit issued to OT Resuscitation Bay"
                  rows={2}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <button
                onClick={handleConfirmFulfillment}
                className="w-full py-3 bg-blood-700 hover:bg-blood-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Confirm Fulfillment & Close Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
