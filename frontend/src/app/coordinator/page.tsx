'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Shield, ShieldAlert, ArrowUpRight, Clock, AlertTriangle, 
  MapPin, CheckCircle, RefreshCw, Radio, PhoneCall, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { BloodRequest } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function CoordinatorDashboard() {
  const [queue, setQueue] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Escalation Modal
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState<BloodRequest | null>(null);
  const [escalationStage, setEscalationStage] = useState<'DISTRICT' | 'STATEWIDE'>('DISTRICT');
  const [escalateReason, setEscalateReason] = useState('Local blood banks have 0 units available. Widening search radius.');

  const loadData = async () => {
    try {
      const [q, s] = await Promise.all([
        api.getCoordinatorQueue(),
        api.getCoordinatorStats()
      ]);
      setQueue(q);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleEscalate = async () => {
    if (!escalateTarget) return;
    try {
      await api.escalateRequest(escalateTarget.id, escalationStage, escalateReason);
      setIsEscalateModalOpen(false);
      loadData();
      alert(`Request escalated to ${escalationStage} network! Additional blood banks & donors notified.`);
    } catch (err: any) {
      alert(`Error escalating: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Emergency Coordinator Console</h1>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">
                State Command Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid escalation management for stalled or rare-group emergency blood requests
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Queue</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Emergencies</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.active_emergency_requests}</span>
            <span className="text-[11px] text-slate-500 font-medium">Under active coordination</span>
          </div>

          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-sm">
            <span className="text-xs font-bold text-blood-700 uppercase tracking-wider block">P0 Critical Needs</span>
            <span className="text-2xl font-black text-blood-700 mt-1 block">{stats.p0_critical_count}</span>
            <span className="text-[11px] text-blood-600 font-medium">&lt; 2hr deadline threshold</span>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Fulfilled Outcomes</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.fulfilled_requests_count}</span>
            <span className="text-[11px] text-emerald-600 font-medium">Reconciled and closed</span>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Matching Candidates</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.total_matches_generated}</span>
            <span className="text-[11px] text-slate-300 font-medium">Banks + Opted-in Donors</span>
          </div>
        </div>
      )}

      {/* P0/P1 Urgent Escalation Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-blood-600 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-900">Urgent Intervention Queue</h2>
          </div>
          <span className="text-xs text-slate-400">Sorted by time remaining to clinical deadline</span>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No P0/P1 emergencies requiring escalation at this moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((req) => (
              <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={req.urgency} size="sm" />
                    <span className="font-mono text-xs font-bold text-slate-500">{req.patient_case_ref}</span>
                    <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      Stage: <strong>{req.escalation_stage}</strong>
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-blood-700">{req.blood_group}</span>
                    <span className="text-base font-semibold uppercase text-slate-800">{req.component}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      ({req.quantity_required} Units Required • {req.quantity_fulfilled} Confirmed)
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Facility:</strong> {req.hospital_name || 'Emergency Trauma Center'} • {req.destination_dept}
                  </p>
                  {req.clinical_notes && (
                    <p className="text-xs text-slate-500 italic">"{req.clinical_notes}"</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-left sm:text-right text-xs">
                    <span className="text-slate-500 block">Required By Target:</span>
                    <span className="font-mono font-bold text-blood-700 text-sm">
                      {new Date(req.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setEscalateTarget(req);
                      setEscalationStage(req.escalation_stage === 'LOCAL' ? 'DISTRICT' : 'STATEWIDE');
                      setIsEscalateModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-blood-700 hover:bg-blood-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Expand Search Radius</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escalation Dialog */}
      {isEscalateModalOpen && escalateTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Tiered Search Escalation</h3>
              <button onClick={() => setIsEscalateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Expanding search boundary triggers automated dual-branch notifications to facilities and verified donors across neighboring jurisdictions.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Geographic Stage</label>
                <select
                  value={escalationStage}
                  onChange={(e) => setEscalationStage(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blood-500"
                >
                  <option value="DISTRICT">Adjacent Districts (15 - 50 km)</option>
                  <option value="STATEWIDE">Statewide Network (50 - 150 km)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Escalation Audit Justification</label>
                <textarea
                  rows={2}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-blood-900">
                All escalations are recorded in the immutable platform audit log with coordinator credentials.
              </div>

              <button
                onClick={handleEscalate}
                className="w-full py-3 bg-blood-700 hover:bg-blood-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Confirm Search Expansion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
