'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, Building2, Layers, ShieldCheck, Filter, 
  Phone, Clock, Users, AlertTriangle, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

// Dynamic import with ssr: false for Leaflet (window is not defined during SSR)
const LeafletMapView = dynamic(
  () => import('@/components/map/LeafletMapView'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] bg-slate-900 rounded-3xl flex items-center justify-center text-white text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blood-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Chhattisgarh Live Leaflet Map...</span>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [donorCoverage, setDonorCoverage] = useState<any>(null);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showDonorDensity, setShowDonorDensity] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMapFacilities(),
      api.getDonorCoverage()
    ]).then(([facs, coverage]) => {
      setFacilities(facs);
      setDonorCoverage(coverage);
      if (facs.length > 0) setSelectedFacility(facs[0]);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredFacilities = facilities.filter(f => {
    if (filterType === 'ALL') return true;
    return f.type === filterType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blood-700 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/10">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statewide Live Leaflet Map</h1>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                e-RaktKosh Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live geographic positioning of 174 blood centers, hospitals & voluntary camps across all 33 Chhattisgarh districts.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: `All Facilities (${facilities.length})` },
            { id: 'blood_bank', label: 'Blood Banks' },
            { id: 'hospital', label: 'Hospitals' },
            { id: 'donation_camp', label: 'Donation Camps' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filterType === f.id
                  ? 'bg-blood-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Leaflet Map (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative min-h-[500px] h-[520px] rounded-3xl overflow-hidden shadow-lg border border-slate-200">
            {/* Top Overlay Bar */}
            <div className="absolute top-4 left-4 z-[400] flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs text-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Showing: <strong>{filteredFacilities.length} Points</strong> across Chhattisgarh</span>
            </div>

            {donorCoverage?.access_allowed && (
              <button
                onClick={() => setShowDonorDensity(!showDonorDensity)}
                className="absolute top-4 right-4 z-[400] bg-white/95 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs text-rose-700 font-bold flex items-center space-x-1.5 transition-all"
              >
                {showDonorDensity ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showDonorDensity ? 'Hide Donor Clusters' : 'Show Donor Clusters'}</span>
              </button>
            )}

            <LeafletMapView
              facilities={filteredFacilities}
              donorClusters={donorCoverage?.clusters || []}
              showDonorDensity={showDonorDensity}
              selectedFacility={selectedFacility}
              onSelectFacility={setSelectedFacility}
            />
          </div>

          {/* Map Legend */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center space-x-5">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-[8px] font-bold text-white">B</span>
                <span className="font-semibold text-slate-800">Blood Bank</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">H</span>
                <span className="font-semibold text-slate-800">Hospital</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] font-bold text-white">C</span>
                <span className="font-semibold text-slate-800">Donation Camp</span>
              </div>
              {donorCoverage?.access_allowed && (
                <div className="flex items-center space-x-2 text-rose-700 font-semibold">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-400/30 border border-rose-500"></span>
                  <span>4km Privacy Donor Cluster</span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-slate-400">Tile Provider: OpenStreetMap / CARTO</span>
          </div>
        </div>

        {/* Right Facility Details Card (4 cols) */}
        <div className="lg:col-span-4">
          {selectedFacility ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blood-700 bg-rose-50 px-2.5 py-1 rounded-full">
                  {selectedFacility.type?.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-slate-500">{selectedFacility.city}</span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 leading-snug">
                  {selectedFacility.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedFacility.address}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-4 h-4 text-blood-600 shrink-0" />
                  <a href={`tel:${selectedFacility.contact_phone}`} className="font-bold text-slate-900 hover:underline">
                    {selectedFacility.contact_phone}
                  </a>
                </div>

                <div className="flex items-center space-x-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Hours: <strong>{selectedFacility.operating_hours || '24x7 Services'}</strong></span>
                </div>

                <div className="flex items-center space-x-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Licenced & Verified by Health Dept CG</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                {selectedFacility.type === 'blood_bank' && (
                  <a
                    href="/blood-bank"
                    className="w-full py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-center font-bold text-xs shadow-sm transition-colors"
                  >
                    View Real-time Stock Breakdown
                  </a>
                )}
                {selectedFacility.type === 'donation_camp' && (
                  <a
                    href="/camps"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-center font-bold text-xs shadow-sm transition-colors"
                  >
                    Register for this Donation Drive
                  </a>
                )}
                {selectedFacility.type === 'hospital' && (
                  <a
                    href="/hospital"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-center font-bold text-xs shadow-sm transition-colors"
                  >
                    Open Hospital Command Desk
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              Click any marker on the map to inspect full address, hours, and direct helplines.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
