'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Heart, ShieldAlert, Activity, ArrowRight, MapPin, 
  Sparkles, CheckCircle2, Shield, Users, Clock, Building2,
  Calendar, Phone, Check, Award, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { BloodRequest, Camp } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function LandingPage() {
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRequests({ urgency: 'P0' }).catch(() => []),
      api.getCamps().catch(() => [])
    ]).then(([reqs, cmps]) => {
      setActiveRequests(reqs.slice(0, 3));
      setCamps(cmps.slice(0, 3));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-16 pb-20 overflow-hidden">
      {/* Hero Section with Smooth Motion */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/70 via-white to-slate-50 border-b border-slate-200/80 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blood-50 border border-blood-200 text-blood-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-blood-600 animate-ping"></span>
            <span>Chhattisgarh Emergency Blood Rescue Network</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight"
          >
            Every Minute Matters. <br className="hidden sm:inline" />
            <span className="text-blood-700">Every Blood Donor Counts.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Connecting 174 blood centers and consenting voluntary donors across Chhattisgarh with real-time digital QR verification and live patient family status tracking.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/donor"
              className="w-full sm:w-auto px-7 py-3.5 bg-blood-700 hover:bg-blood-800 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Donor Hub / View Alerts</span>
            </Link>
            <Link
              href="/hospital"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Hospital Command Center</span>
            </Link>
            <Link
              href="/patient"
              className="w-full sm:w-auto px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-blood-800 border border-rose-200 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <Activity className="w-4 h-4 text-blood-600" />
              <span>Family Live Tracker</span>
            </Link>
          </motion.div>

          {/* Real Metrics Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left"
          >
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Blood Centers</span>
              <span className="text-2xl font-black text-slate-900">174 Centers</span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Govt + Private + Red Cross</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Arrival Pass</span>
              <span className="text-2xl font-black text-slate-900">Live QR Tokens</span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Camera verification desk</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Stock Reporting</span>
              <span className="text-2xl font-black text-slate-900">1,480+ Lots</span>
              <span className="text-[11px] text-blood-600 font-semibold block mt-0.5">e-RaktKosh live sync</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Community Camps</span>
              <span className="text-2xl font-black text-slate-900">391 Drives</span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">All 33 CG districts</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live High-Priority Emergency Ticker */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-blood-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-blood-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Active High-Priority Emergency Requests</h2>
                <p className="text-xs text-slate-500">Live emergency requests matching voluntary donors statewide</p>
              </div>
            </div>
            <Link
              href="/hospital"
              className="text-xs font-bold text-blood-700 hover:text-blood-800 flex items-center space-x-1"
            >
              <span>Hospital Command Desk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              All active requests fulfilled. Emergency desks standing by.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRequests.map((req) => (
                <div key={req.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blood-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={req.urgency} size="sm" />
                    <span className="text-xs font-mono font-bold text-slate-500">{req.patient_case_ref}</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-blood-700">{req.blood_group}</span>
                    <span className="text-xs font-bold uppercase text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {req.component}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    <p className="font-bold text-slate-900 truncate">{req.hospital_name || 'Ambedkar Memorial Hospital Raipur'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{req.destination_dept}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Required: <strong>{req.quantity_required} Units</strong></span>
                    <Link
                      href="/donor"
                      className="text-blood-700 font-bold hover:underline flex items-center space-x-1"
                    >
                      <span>Respond &rarr;</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Blood Donation Drives */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-blood-700 uppercase tracking-wider block">Upcoming Drives</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Voluntary Donation Camps in Chhattisgarh
            </h2>
          </div>
          <Link
            href="/camps"
            className="text-xs font-bold text-blood-700 hover:text-blood-800 flex items-center space-x-1"
          >
            <span>View All 391 Camps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {camps.map(camp => (
            <div key={camp.id} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                    {camp.city}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Cap: {camp.target_capacity}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">{camp.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{camp.venue_address}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Partner: <strong>{camp.partner_blood_bank?.slice(0, 22)}...</strong></span>
                <Link
                  href="/camps"
                  className="font-bold text-blood-700 hover:underline"
                >
                  Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-blood-700 uppercase tracking-wider">How BloodLink Works</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">

            Real-Time Transfusion Coordination
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Engineered for zero delays during critical medical trauma and surgical resuscitation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blood-50 text-blood-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. Hospital Emergency Broadcast</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When trauma surgery requires blood, the command desk broadcasts requirements with urgency tiers (P0–P3) directly into the statewide network.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. Instant Donor QR Pass</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eligible voluntary donors accept alerts in the Donor Hub and immediately receive a digital arrival QR Pass with hospital location details.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. Camera QR Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hospital reception verifies the donor's digital pass with a camera scan, logs arrival in real time, and updates the patient family tracking view.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
