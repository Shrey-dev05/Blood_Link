'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Clock, MapPin, Calendar, Users, Phone, Building2, 
  Search, CheckCircle2, QrCode, X, Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { Camp } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function CampsDirectoryPage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [loading, setLoading] = useState(true);

  // Camp Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [registeredResult, setRegisteredResult] = useState<any>(null);
  const [registering, setRegistering] = useState(false);

  const loadCamps = async () => {
    try {
      const data = await api.getCamps(searchCity.trim() || undefined);
      setCamps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCamps();
  }, [searchCity]);

  const handleRegister = async () => {
    if (!selectedCamp) return;
    setRegistering(true);
    try {
      // In demo mode, register as Rahul (DONOR-1042)
      const res = await api.registerForCamp(selectedCamp.id, 'donor-rahul-id');
      setRegisteredResult(res);
      loadCamps();
    } catch (err: any) {
      alert(`Registration error: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blood-700">Voluntary Blood Drives</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Donation Camps Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover community blood drives organized by registered NGOs and partner blood banks.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-200 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>391 Verified Drives in Chhattisgarh</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Filter by district (e.g. Raipur, Durg, Bilaspur, Bastar)..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blood-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Camps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {camps.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={camp.status} size="sm" />
                <span className="text-xs text-slate-400 font-semibold">{camp.city}</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 leading-snug">{camp.title}</h2>
              {camp.description && (
                <p className="text-xs text-slate-600 line-clamp-2">{camp.description}</p>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blood-600 shrink-0" />
                  <span className="truncate">{camp.venue_address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {new Date(camp.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(camp.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(camp.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Partner: <strong>{camp.partner_blood_bank}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Turnout: <strong>{camp.registered_count}</strong> / {camp.target_capacity} Registered</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Helpline: {camp.contact_phone}</span>
              <button
                onClick={() => {
                  setSelectedCamp(camp);
                  setRegisteredResult(null);
                  setIsRegisterOpen(true);
                }}
                className="px-5 py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/10 transition-colors"
              >
                Register for Drive
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Camp Registration Modal */}
      {isRegisterOpen && selectedCamp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Register for Blood Drive</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedCamp.title}</div>
              <div className="text-slate-600">{selectedCamp.venue_address}</div>
              <div className="text-slate-500">{new Date(selectedCamp.start_date).toDateString()}</div>
            </div>

            {!registeredResult ? (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Voluntary donation helps maintain safe regional stock. Refreshments and official certificates are provided at the drive.
                </p>

                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3 bg-blood-700 hover:bg-blood-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {registering ? 'Confirming Registration...' : 'Confirm Registration & Generate Pass'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-bold text-emerald-900 text-sm">{registeredResult.message}</div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-300 inline-block font-mono font-black text-lg text-emerald-800">
                  {registeredResult.registration_code}
                </div>
                <p className="text-[11px] text-emerald-700">
                  Present this code or your digital pass at the camp reception desk.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
