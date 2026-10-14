'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Heart, ShieldAlert, CheckCircle, Clock, MapPin, 
  Phone, Navigation, QrCode, Sparkles, AlertCircle, Building2,
  CheckCircle2, ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { DonorProfile } from '@/types';
import { QRPassModal } from '@/components/ui/QRPassModal';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function DonorDashboard() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [donorSession, setDonorSession] = useState<any>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [activeQRData, setActiveQRData] = useState<{
    passCode: string;
    facilityName: string;
    facilityAddress?: string;
    expiresAt: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const savedSession = typeof window !== 'undefined' ? (localStorage.getItem('bloodlink_donor_session') || localStorage.getItem('raktareach_donor_session')) : null;
      const donorId = typeof window !== 'undefined' ? (localStorage.getItem('bloodlink_donor_id') || localStorage.getItem('raktareach_donor_id') || undefined) : undefined;

      if (savedSession) {
        try {
          setDonorSession(JSON.parse(savedSession));
        } catch (e) {}
      }

      const [prof, reqs] = await Promise.all([
        api.getDonorProfile(donorId),
        api.getDonorInbox(donorId)
      ]);
      setProfile(prof);
      setInbox(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAvailabilityToggle = async (newState: 'available' | 'unavailable' | 'paused') => {
    try {
      const updated = await api.updateDonorAvailability(newState);
      setProfile(updated);
    } catch (err: any) {
      alert(`Error updating availability: ${err.message}`);
    }
  };

  const handleConsentToggle = async (key: 'opt_in_alerts' | 'map_discoverable') => {
    if (!profile) return;
    try {
      const updated = await api.updateDonorConsent({ [key]: !profile[key] });
      setProfile(updated);
    } catch (err: any) {
      alert(`Error updating consent: ${err.message}`);
    }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const donorId = typeof window !== 'undefined' ? localStorage.getItem('raktareach_donor_id') || undefined : undefined;
      const res = await api.respondToRequest(requestId, action, donorId);
      if (action === 'accept' && res.pass_code) {
        setActiveQRData({
          passCode: res.pass_code,
          facilityName: res.facility_name,
          facilityAddress: res.facility_address,
          expiresAt: res.expires_at
        });
        setIsQRModalOpen(true);
      }
      await loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMarkTravelling = async (requestId: string) => {
    try {
      await api.markTravelling(requestId);
      alert('Hospital staff notified that you are en route!');
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Real-time Twilio & Account Controls Bar */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-5 text-white shadow-lg shadow-rose-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Phone className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-sm sm:text-base tracking-tight">
                Twilio Emergency Dispatch Active
              </span>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm">
                SMS & Call
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              Alerts dispatched to <strong className="text-white font-mono">{donorSession?.phone || '+917587769823'}</strong> when matching hospital requests are created.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link
            href="/donor/auth"
            className="px-3.5 py-2 bg-white text-blood-700 rounded-xl text-xs font-bold shadow-md hover:bg-rose-50 transition-colors inline-flex items-center space-x-1.5"
          >
            <span>🔑 Switch / Register</span>
          </Link>
        </div>
      </div>

      {/* Donor Profile Header Card */}
      {profile && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blood-700 to-rose-600 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-900/20 shrink-0">
              <span className="text-2xl font-black">{profile.blood_group}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-100">Blood</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {profile.display_name || 'Rahul Verma'}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                  {profile.donor_code}
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Donor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {profile.area}, {profile.city} • Lifetime Donations: <strong className="text-slate-800">{profile.total_donations}</strong>
              </p>
            </div>
          </div>

          {/* Availability Status Selector */}
          <div className="flex flex-col sm:items-end space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Emergency Availability
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
              <button
                onClick={() => handleAvailabilityToggle('available')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  profile.availability_state === 'available'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Available
              </button>
              <button
                onClick={() => handleAvailabilityToggle('unavailable')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  profile.availability_state === 'unavailable'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unavailable
              </button>
              <button
                onClick={() => handleAvailabilityToggle('paused')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  profile.availability_state === 'paused'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pause
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Privacy Notice Strip */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Privacy Protected:</strong> Your exact coordinates and telephone number are never disclosed publicly.
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => handleConsentToggle('opt_in_alerts')}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900"
          >
            <span className={`w-2 h-2 rounded-full ${profile?.opt_in_alerts ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            <span>Alerts: <strong>{profile?.opt_in_alerts ? 'ON' : 'OFF'}</strong></span>
          </button>
        </div>
      </div>

      {/* Incoming Emergency Requests Inbox */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-blood-600 animate-pulse"></span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Emergency Alerts & Requests ({inbox.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Automatic matching for compatible blood</span>
        </div>

        {inbox.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Emergency Blood Requests Pending</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You will automatically receive high-priority alerts here whenever a hospital in Chhattisgarh raises a request matching your blood group.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inbox.map((req) => {
              const isAccepted = req.response_state === 'ACCEPTED' || req.response_state === 'TRAVELLING' || req.response_state === 'ARRIVED_QR_VERIFIED';
              const effectivePassCode = req.pass_code || 'RR-9821';

              return (
                <div
                  key={req.match_id || req.request_id}
                  className={`bg-white rounded-3xl p-6 border transition-all space-y-4 ${
                    isAccepted
                      ? 'border-emerald-300 ring-2 ring-emerald-50 shadow-md'
                      : 'border-slate-200 hover:border-blood-300 shadow-sm'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={req.urgency} size="sm" />
                      {req.patient_case_ref && (
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {req.patient_case_ref}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        • Approx. {req.distance_km} km away
                      </span>
                    </div>

                    <div className="flex items-center text-rose-700 text-xs font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      <span>Due: {new Date(req.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-black text-blood-700">{req.blood_group}</span>
                        <span className="text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {req.component}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          ({req.quantity_required} Units Needed)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{req.hospital_name}</h3>
                      <p className="text-xs text-slate-500">{req.hospital_address}</p>
                      {req.destination_dept && (
                        <p className="text-[11px] text-blood-700 font-medium mt-0.5">Dept: {req.destination_dept}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-semibold uppercase">Current Status</span>
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-0.5 ${
                        req.response_state === 'ARRIVED_QR_VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : isAccepted
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.response_state === 'ARRIVED_QR_VERIFIED' ? 'ARRIVED & VERIFIED' : req.response_state}
                      </span>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 text-xs text-slate-600">
                      <a
                        href={`tel:${req.hospital_phone}`}
                        className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 text-blood-600" />
                        <span>Call Facility: {req.hospital_phone}</span>
                      </a>
                    </div>

                    {!isAccepted ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRespond(req.request_id, 'decline')}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                        >
                          Cannot Attend
                        </button>
                        <button
                          onClick={() => handleRespond(req.request_id, 'accept')}
                          className="px-5 py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/10 transition-all flex items-center space-x-1.5 transform hover:-translate-y-0.5"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>Accept & Generate QR Pass</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => {
                            setActiveQRData({
                              passCode: effectivePassCode,
                              facilityName: req.hospital_name,
                              facilityAddress: req.hospital_address,
                              expiresAt: req.due_at
                            });
                            setIsQRModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-rose-400" />
                          <span>Show Arrival QR Pass</span>
                        </button>

                        {req.response_state !== 'ARRIVED_QR_VERIFIED' && (
                          <button
                            onClick={() => handleMarkTravelling(req.request_id)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                          >
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>Mark Travelling</span>
                          </button>
                        )}

                        {req.response_state === 'ARRIVED_QR_VERIFIED' && (
                          <span className="flex items-center space-x-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pass Scanned by Hospital</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Generated QR Pass Modal */}
      {activeQRData && (
        <QRPassModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          passCode={activeQRData.passCode}
          facilityName={activeQRData.facilityName}
          facilityAddress={activeQRData.facilityAddress}
          expiresAt={activeQRData.expiresAt}
        />
      )}
    </div>
  );
}
