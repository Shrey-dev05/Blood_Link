'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Send, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function NewBloodRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [department, setDepartment] = useState('Trauma Resuscitation Unit');
  const [bedNumber, setBedNumber] = useState('ICU Bed #3');
  const [form, setForm] = useState({
    patient_case_ref: `EMERG-${Math.floor(1000 + Math.random() * 9000)}`,
    component: 'prbc',
    blood_group: 'O-',
    quantity_required: 2,
    urgency: 'P0',
    clinical_notes: 'Acute hemorrhagic shock following road traffic accident. Immediate transfusion.',
    due_in_hours: 2
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fullDestination = `${department.trim()} — ${bedNumber.trim()}`;
      const res = await api.createRequest({
        ...form,
        destination_dept: fullDestination
      });
      alert(`Emergency Blood Request ${res.patient_case_ref} broadcasted! Eligible donors & local blood banks within 5 km have been notified.`);
      router.push('/hospital');
    } catch (err: any) {
      alert(`Failed to create request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/hospital"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Hospital Command Center</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-50 text-blood-700 rounded-full text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dr. B.R. Ambedkar Memorial Hospital Raipur</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Raise Emergency Blood Requirement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submitting broadcasts immediate alerts to registered voluntary donors and searches available regional blood bank inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pseudonymous Patient Case Ref *
              </label>
              <input
                type="text"
                required
                value={form.patient_case_ref}
                onChange={(e) => setForm({ ...form, patient_case_ref: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-blood-500 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Do not enter patient full name (privacy protection)
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Urgency Priority Tier *
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blood-500 font-bold"
              >
                <option value="P0">P0 - Critical / Immediate Transfusion (&lt; 2 hrs)</option>
                <option value="P1">P1 - Urgent / Same Day (&lt; 6 hrs)</option>
                <option value="P2">P2 - Scheduled Surgery</option>
                <option value="P3">P3 - Advance / Routine Reserve</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Blood Group Required *
              </label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blood-500 font-bold text-blood-700"
              >
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Component *
              </label>
              <select
                value={form.component}
                onChange={(e) => setForm({ ...form, component: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blood-500 font-semibold"
              >
                <option value="prbc">Packed Red Blood Cells (PRBC)</option>
                <option value="whole_blood">Whole Blood</option>
                <option value="platelets">Platelet Concentrate (RDP/SDP)</option>
                <option value="ffp">Fresh Frozen Plasma (FFP)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Quantity (Units) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={form.quantity_required}
                onChange={(e) => setForm({ ...form, quantity_required: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Destination Department *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Trauma Resuscitation Unit"
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Patient Bed Number *
              </label>
              <input
                type="text"
                required
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                placeholder="e.g. ICU Bed #3 / Ward 2 Bed 14"
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500 font-semibold text-slate-900"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 -mt-2 block">
            📍 Automatically routed to the hospital scanner screen when the donor QR pass is verified at the triage desk.
          </span>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Clinical Notes & Transfusion Urgency
            </label>
            <textarea
              rows={3}
              value={form.clinical_notes}
              onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })}
              placeholder="Provide clinical context (e.g. acute gastrointestinal bleed, active trauma hemorrhage)"
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blood-500"
            />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start space-x-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong>Instant Statewide Donor Alert:</strong> Submitting will immediately list this request in the <strong>Donor Hub</strong> for eligible donors with compatible blood groups, and allow them to accept and generate a digital arrival pass in real time.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <Link
              href="/hospital"
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blood-700 hover:bg-blood-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-rose-900/10 transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Broadcasting Emergency...' : 'Launch Emergency Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
