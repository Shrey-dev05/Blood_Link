'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Heart, ShieldAlert, CheckCircle2, Clock, Users, ArrowRight,
  Phone, Building2, AlertTriangle, RefreshCw, Activity, Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';
import { BloodRequest } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

function PatientFamilyDashboardContent() {
  const searchParams = useSearchParams();
  const caseRefParam = searchParams.get('case');

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>(caseRefParam || '');
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data);
      if (!selectedCase && data.length > 0) {
        setSelectedCase(data[0].patient_case_ref);
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

  const currentRequest = requests.find(r => r.patient_case_ref === selectedCase) || requests[0];

  // Derive stage indicator
  const getStageStep = (status: string, matches: any[] = []) => {
    if (status === 'FULFILLED') return 4;
    const hasArrived = matches.some(m => m.response_state === 'ARRIVED_QR_VERIFIED');
    if (hasArrived || status === 'FULFILLMENT_IN_PROGRESS') return 3;
    const hasAccepted = matches.some(m => m.response_state === 'ACCEPTED' || m.response_state === 'TRAVELLING');
    if (hasAccepted || status === 'SOURCE_CONFIRMED') return 2;
    return 1;
  };

  const currentStep = currentRequest ? getStageStep(currentRequest.status, currentRequest.matches || []) : 1;

  const donorMatches = currentRequest?.matches?.filter(m => m.source_type === 'donor') || [];
  const bankMatches = currentRequest?.matches?.filter(m => m.source_type === 'blood_bank') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner for Patient Families */}
      <div className="bg-gradient-to-r from-blood-800 to-rose-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-rose-950/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-rose-100">
            <Heart className="w-3.5 h-3.5 fill-current text-white" />
            <span>Patient Family Live Blood Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Real-Time Blood Donor & Fulfillment Status
          </h1>
          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            Stay informed with transparent, live progress as donors accept requests and units are verified at the hospital desk.
          </p>
        </div>
      </div>

      {/* Case Selector Dropdown if multiple cases */}
      {requests.length > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Track Patient Case:</span>
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="text-xs font-mono font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blood-500"
          >
            {requests.map(r => (
              <option key={r.id} value={r.patient_case_ref}>
                {r.patient_case_ref} ({r.blood_group} - {r.hospital_name})
              </option>
            ))}
          </select>
        </div>
      )}

      {currentRequest ? (
        <div className="space-y-6">
          {/* Main Case Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Case {currentRequest.patient_case_ref}
                  </span>
                  <StatusBadge status={currentRequest.urgency} size="sm" />
                  <StatusBadge status={currentRequest.status} size="sm" />
                </div>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-3xl font-black text-blood-700">{currentRequest.blood_group}</span>
                  <span className="text-base font-bold uppercase text-slate-800">{currentRequest.component}</span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({currentRequest.quantity_required} Units Needed)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {currentRequest.hospital_name} • {currentRequest.destination_dept}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Progress</span>
                <span className="text-2xl font-black text-emerald-600">
                  {currentRequest.quantity_fulfilled} / {currentRequest.quantity_required}
                </span>
                <span className="text-[11px] text-slate-500 block">Units Secured</span>
              </div>
            </div>

            {/* Visual Step-by-Step Status Stepper */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Transfusion Pipeline Status
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 1 ? 'bg-blood-700 text-white ring-4 ring-rose-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    1
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Request Broadcasted</span>
                  <span className="text-[10px] text-slate-400 block">Alerted voluntary donors</span>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 2 ? 'bg-blood-700 text-white ring-4 ring-rose-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    2
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Donor Accepted</span>
                  <span className="text-[10px] text-slate-400 block">QR Pass issued to donor</span>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 3 ? 'bg-blood-700 text-white ring-4 ring-rose-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    3
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Donor At Hospital</span>
                  <span className="text-[10px] text-slate-400 block">QR scanned by hospital</span>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep >= 4 ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-slate-100 text-slate-400'
                  }`}>
                    4
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Blood Fulfilled</span>
                  <span className="text-[10px] text-slate-400 block">Ready for patient transfusion</span>
                </div>
              </div>
            </div>

            {/* Active Donor Information (Privacy Safe) */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-blood-600" />
                <span>Responding Donors Status ({donorMatches.length})</span>
              </h3>

              {donorMatches.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  Voluntary donors have been notified across the district. Awaiting first acceptance...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {donorMatches.map(dm => {
                    const isArrived = dm.response_state === 'ARRIVED_QR_VERIFIED';
                    const isTravelling = dm.response_state === 'TRAVELLING';
                    const isAccepted = dm.response_state === 'ACCEPTED';

                    return (
                      <div
                        key={dm.id}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-900 font-bold">{dm.source_name}</strong>
                            <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                              Verified Donor
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Location: Approx. {dm.distance_km} km away from hospital
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 ${
                            isArrived
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isTravelling
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : isAccepted
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isArrived ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Arrived at Hospital Desk</span>
                              </>
                            ) : isTravelling ? (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>En Route / Travelling</span>
                              </>
                            ) : isAccepted ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                                <span>Accepted & Preparing</span>
                              </>
                            ) : (
                              <span>Notified</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hospital Helplines */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <div>
                <strong className="text-slate-900 block font-semibold">{currentRequest.hospital_name}</strong>
                <span className="text-slate-500 text-[11px]">Emergency Transfusion Desk</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`tel:${(currentRequest as any).hospital?.contact_phone || '+91-771-2235600'}`}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-blood-600" />
                  <span>Call Hospital Desk</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          No active emergency blood request found.
        </div>
      )}
    </div>
  );
}

export default function PatientFamilyDashboard() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading family tracker...</div>}>
      <PatientFamilyDashboardContent />
    </Suspense>
  );
}
