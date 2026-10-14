'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, User, Activity, MapPin, QrCode, Shield, Bot, 
  ArrowRight, CheckCircle2, AlertTriangle, Layers, Clock
} from 'lucide-react';

export default function UserFlowPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'hospital' | 'donor' | 'bloodbank' | 'coordinator' | 'camps' | 'privacy'>('overview');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-50 text-blood-700 rounded-full text-xs font-bold mb-3 border border-rose-200">
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Manual & User Flow Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How to Use BloodLink
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-3xl">
          BloodLink bridges hospitals, registered blood banks, consenting voluntary donors, and emergency coordinators into a unified, traceable lifecycle.
        </p>

      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2 mb-8">
        {[
          { id: 'overview', label: '1. Core Overview', icon: Activity },
          { id: 'hospital', label: '2. Hospital Staff', icon: Building2 },
          { id: 'donor', label: '3. Individual Donor', icon: User },
          { id: 'bloodbank', label: '4. Blood Bank', icon: Layers },
          { id: 'coordinator', label: '5. Emergency Coordinator', icon: Shield },
          { id: 'camps', label: '6. Donation Camps', icon: Clock },
          { id: 'privacy', label: '7. Privacy & QR Security', icon: QrCode }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blood-700 text-white shadow-md shadow-rose-900/10'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Platform Workflow & Core Principles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100">
                <div className="w-10 h-10 rounded-xl bg-blood-600 text-white flex items-center justify-center font-bold mb-3">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Parallel Source Matching</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When a request is submitted, the matching engine searches <strong>Blood Bank Inventory</strong> and <strong>Consented Donors</strong> concurrently. No serial delay.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold mb-3">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Lead vs. Fulfilled Unit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A donor accepting an alert is a <strong>willing lead</strong>, not blood in hand. Donors must arrive and pass screening. Requests only fulfill when clinical staff record verification.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Zero-Leakage Privacy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Public maps never reveal donor locations or names. Dynamic QR arrival tokens are opaque and short-lived, with zero patient or health identifier data embedded.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Ready to explore role actions? Switch roles in the top nav or select a persona:</span>
              <Link href="/hospital" className="inline-flex items-center space-x-1.5 text-xs font-bold text-blood-700 hover:underline">
                <span>Go to Hospital Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'hospital' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Hospital Staff Workflow</h2>
            
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Create Emergency Blood Request</strong>
                  Input pseudonymous Case ID (e.g. <code>TRAUMA-2026-9041</code>), blood component (PRBC, Platelets, Whole Blood, FFP), urgency tier (P0 Critical to P3 Routine), and required units.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Inspect Dual Matching Branches</strong>
                  View Branch A (Blood Bank Stock with freshness label) and Branch B (Contacted Donors within radius with response state: Notified, Accepted, Travelling).
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Scan Arrival QR Pass</strong>
                  When a donor arrives at triage, enter their 8-character pass code (or scan via device camera). The system marks arrival and prevents pass reuse.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-blood-600 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Screening & Fulfillment Confirmation</strong>
                  Log clinical screening outcome (<code>Eligible</code> or <code>Deferred</code>), input official blood unit barcode upon collection, and confirm request fulfillment.
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Link href="/hospital" className="bg-blood-700 hover:bg-blood-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Launch Hospital Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'donor' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Individual Donor Experience</h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Manage Live Availability</strong>
                  Toggle between <strong>Available to Contact</strong>, <strong>Temporarily Unavailable</strong>, or <strong>Pause Requests</strong> with one click.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Receive Urgent Alert Cards</strong>
                  Receive high-priority emergency notifications showing required blood group, hospital name, approximate distance, and countdown deadline.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Accept & Receive Dynamic QR Pass</strong>
                  Click Accept &rarr; Instant generation of your single-use QR pass with facility directions and telephone contact.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">4</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Optional "Mark Travelling"</strong>
                  Notify hospital staff that you are en route without exposing your continuous background location.
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Link href="/donor" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Launch Donor Hub &rarr;
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'bloodbank' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Blood Bank Workspace</h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <p>
                Blood banks manage inventory across PRBC, Platelets, Whole Blood, and FFP with explicit freshness status (<code>Confirmed Available</code>, <code>Reported Unverified</code>, <code>Stale</code>, <code>Reserved</code>).
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold">Safe Inventory Reservation</strong>
                When an emergency request arrives, authorized blood bank staff can reserve units with zero race-condition double allocation.
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Link href="/blood-bank" className="bg-blood-700 hover:bg-blood-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Launch Blood Bank Workspace &rarr;
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'coordinator' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Emergency Coordinator Console</h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <p>
                The state emergency coordinator monitors all active P0 Critical and P1 Urgent requests across the network.
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <strong className="text-slate-900 block font-semibold">Tiered Search Escalation</strong>
                If a rare blood group cannot be secured locally, the coordinator triggers search radius escalation:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Local Radius</strong> (0 - 15 km)</li>
                  <li><strong>Adjacent Districts</strong> (15 - 50 km)</li>
                  <li><strong>Statewide Network</strong> (50+ km)</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Link href="/coordinator" className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Launch Coordinator Console &rarr;
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'camps' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Donation Camps & NGO Drives</h2>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <p>
                Community organizations and NGOs publish upcoming blood donation drives with venue, dates, target capacity, and partner blood centers. Donors can register and receive instant Camp Pass QR codes.
              </p>
            </div>
            <div className="pt-4 flex justify-end">
              <Link href="/camps" className="bg-blood-700 hover:bg-blood-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                Explore Camps &rarr;
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Privacy & QR Security Architecture</h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900">
                <strong>Opaque Tokens Only:</strong> The QR pass contains an unpredictable cryptographic token hash and a short human-readable fallback code. No donor phone, address, or patient health information is contained in the QR code.
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <strong>Replay & Reuse Protection:</strong> Once scanned by authorized facility staff, the pass is atomically moved to <code>USED</code> state. Any screenshot replay attempts are automatically rejected by the backend.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
