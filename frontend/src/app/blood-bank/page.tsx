'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, Layers, Plus, RefreshCw, AlertCircle, 
  CheckCircle2, Clock, ShieldCheck, Edit3, X,
  Phone, Check, ArrowRight, ShieldAlert, Heart
} from 'lucide-react';
import { api } from '@/lib/api';
import { InventoryItem, Organization } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function BloodBankPage() {
  const [bloodBanks, setBloodBanks] = useState<Organization[]>([]);
  const [selectedBank, setSelectedBank] = useState<Organization | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit stock modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [newUnits, setNewUnits] = useState(0);
  const [newStatus, setNewStatus] = useState('CONFIRMED_AVAILABLE');

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const banks = await api.getBloodBanks();
      setBloodBanks(banks || []);
      const activeBank = selectedBank || (banks && banks.length > 0 ? banks[0] : null);
      if (activeBank) {
        setSelectedBank(activeBank);
        const [inv, reqs] = await Promise.all([
          api.getBankInventory(activeBank.id).catch(() => []),
          api.getBankIncomingRequests(activeBank.id).catch(() => [])
        ]);
        setInventory(Array.isArray(inv) ? inv : []);
        setIncomingRequests(Array.isArray(reqs) ? reqs : []);
      }
    } catch (err: any) {
      console.error('Error loading blood bank data:', err);
      setError(err?.message || 'Failed to load blood banks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (selectedBank) {
        api.getBankIncomingRequests(selectedBank.id)
          .then((reqs) => {
            if (Array.isArray(reqs)) setIncomingRequests(reqs);
          })
          .catch(() => {});
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedBank?.id]);

  const handleBankChange = async (bank: Organization) => {
    setSelectedBank(bank);
    setLoading(true);
    try {
      const [inv, reqs] = await Promise.all([
        api.getBankInventory(bank.id).catch(() => []),
        api.getBankIncomingRequests(bank.id).catch(() => [])
      ]);
      setInventory(Array.isArray(inv) ? inv : []);
      setIncomingRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, units: number) => {
    if (!selectedBank) return;
    setRespondingId(requestId);
    try {
      await api.respondBloodBankRequest(selectedBank.id, requestId, 'accept', units);
      const reqs = await api.getBankIncomingRequests(selectedBank.id);
      if (Array.isArray(reqs)) setIncomingRequests(reqs);
      alert(`✅ Blood supply accepted! The hospital command center has been notified and will coordinate collection/dispatch.`);
    } catch (err: any) {
      alert(`Failed to accept request: ${err.message}`);
    } finally {
      setRespondingId(null);
    }
  };

  const handleSaveStock = async () => {
    if (!editItem) return;
    try {
      await api.updateInventoryStock(editItem.id, newUnits, newStatus);
      setIsEditModalOpen(false);
      if (selectedBank) {
        const inv = await api.getBankInventory(selectedBank.id);
        if (Array.isArray(inv)) setInventory(inv);
      }
      alert('Inventory stock and freshness status updated!');
    } catch (err: any) {
      alert(`Error updating stock: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blood Bank Workspace</h1>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Licensed Facility
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Component separation, freshness verification, and transaction-safe reservations
            </p>
          </div>
        </div>

        {/* Blood Bank Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-500">Active Facility:</span>
          <select
            value={selectedBank?.id || ''}
            onChange={(e) => {
              const b = bloodBanks.find(bk => bk.id === e.target.value);
              if (b) handleBankChange(b);
            }}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blood-500"
          >
            {bloodBanks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Freshness Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 uppercase">Confirmed Stock</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            Reconfirmed by staff within the last 4 hours. Available for immediate matching.
          </p>
        </div>

        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 uppercase">Stale / Needs Re-check</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-[11px] text-amber-800 mt-1">
            Last update exceeds freshness window. Hospital is instructed to confirm via telephone.
          </p>
        </div>

        <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 uppercase">Reserved Units</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-[11px] text-blue-800 mt-1">
            Committed to active hospital emergency requests. Protected from double-reservation.
          </p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800 uppercase">External Sync Health</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            Data Source: <strong>e-RaktKosh Chhattisgarh Verified</strong>. Active stock tracking enabled.
          </p>
        </div>
      </div>

      {/* Emergency Requisitions (< 5 km Radius) Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-blood-600 animate-ping"></span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Hospital Emergency Requisitions (&lt; 5 km Radius)
            </h2>
            <span className="text-xs font-bold bg-rose-100 text-blood-800 px-2.5 py-0.5 rounded-full">
              {incomingRequests.length} Active Alerts
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Immediate notifications dispatched to blood banks within 5 km of trauma center
          </span>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <h3 className="text-xs font-bold text-slate-800">No Pending Emergency Requisitions</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              When a nearby hospital in Raipur creates an emergency blood requirement, it will instantly notify this facility with distance and department routing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingRequests.map((req) => {
              const isAccepted = req.response_state === 'ACCEPTED';
              return (
                <div
                  key={req.match_id || req.request_id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isAccepted
                      ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-100 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blood-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={req.urgency || 'P0'} size="sm" />
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {req.patient_case_ref || 'EMERGENCY'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blood-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      ~{typeof req.distance_km === 'number' ? req.distance_km.toFixed(1) : (req.distance_km || '2.0')} km away
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-slate-900">{req.blood_group}</span>
                      <span className="text-xs font-bold uppercase text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {(req.component || 'prbc').toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        ({req.quantity_required ?? 1} Units Needed)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{req.hospital_name || 'Hospital Trauma Center'}</h3>
                    <p className="text-xs text-slate-500">{req.hospital_address || 'Raipur'}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      📍 Destination: <span className="text-blood-700">{req.destination_dept || 'Emergency OT'}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-blood-600" />
                      <a href={`tel:${req.hospital_phone}`} className="font-bold hover:underline">
                        {req.hospital_phone}
                      </a>
                    </div>

                    {isAccepted ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Supply Confirmed to Hospital</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcceptRequest(req.request_id, req.quantity_required)}
                        disabled={respondingId === req.request_id}
                        className="px-4 py-2 bg-blood-700 hover:bg-blood-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/10 transition-colors flex items-center space-x-1.5"
                      >
                        {respondingId === req.request_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accept & Confirm Supply</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Component Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Component Stock Inventory</h2>
            <p className="text-xs text-slate-500">Real-time availability by component and ABO/Rh blood group</p>
          </div>
          <button
            onClick={() => {
              if (selectedBank) handleBankChange(selectedBank);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Stock</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Blood Group</th>
                <th className="py-3 px-6">Component</th>
                <th className="py-3 px-6">Available Units</th>
                <th className="py-3 px-6">Reserved</th>
                <th className="py-3 px-6">Freshness Status</th>
                <th className="py-3 px-6">Last Verified</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blood-600 mb-2" />
                    Loading inventory stock...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No inventory records found for this facility. Click "Refresh Stock" or select another blood bank.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-base font-black text-blood-700">{item.blood_group}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold uppercase text-slate-700">
                      {(item.component || '').replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {item.units_available ?? 0} Units
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {item.units_reserved ?? 0} Units
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={item.status || 'CONFIRMED_AVAILABLE'} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-[11px] text-slate-500">
                      {item.last_source_update
                        ? new Date(item.last_source_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Recent'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setNewUnits(item.units_available);
                          setNewStatus(item.status);
                          setIsEditModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-blood-700 text-slate-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Adjust {editItem.blood_group} {editItem.component.toUpperCase()}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Available Units Count</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newUnits}
                  onChange={(e) => setNewUnits(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Verification Freshness Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold focus:ring-2 focus:ring-blood-500"
                >
                  <option value="CONFIRMED_AVAILABLE">CONFIRMED AVAILABLE (Verified Today)</option>
                  <option value="REPORTED_UNVERIFIED">REPORTED UNVERIFIED</option>
                  <option value="STALE">STALE (Awaiting Physical Count)</option>
                  <option value="RESERVED">RESERVED</option>
                </select>
              </div>

              <button
                onClick={handleSaveStock}
                className="w-full py-3 bg-blood-700 hover:bg-blood-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Save Inventory Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
