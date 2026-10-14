'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, Shield, Phone, Sparkles, CheckCircle2, ArrowRight, 
  MapPin, UserCheck, AlertCircle, Lock, BellRing, PhoneCall
} from 'lucide-react';
import { api } from '@/lib/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CG_CITIES = [
  'Raipur', 'Bhilai', 'Durg', 'Bilaspur', 'Korba', 
  'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari', 'Mahasamund'
];

export default function DonorAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In Form
  const [loginIdentifier, setLoginIdentifier] = useState('+917587769823');

  // Registration Form
  const [regData, setRegData] = useState({
    display_name: '',
    phone: '+917587769823',
    email: '',
    blood_group: 'O+',
    city: 'Raipur',
    area: 'Pandri, Raipur',
    opt_in_alerts: true,
    map_discoverable: true,
    health_declared: true
  });

  // Current session check
  const [currentDonor, setCurrentDonor] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('bloodlink_donor_session') || localStorage.getItem('raktareach_donor_session');
    if (saved) {

      try {
        setCurrentDonor(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError('Please enter your registered mobile number or donor code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginDonor(loginIdentifier.trim());
      localStorage.setItem('bloodlink_donor_id', res.donor_id);
      localStorage.setItem('bloodlink_donor_session', JSON.stringify(res));
      localStorage.setItem('bloodlink_role', 'donor');
      localStorage.setItem('raktareach_donor_id', res.donor_id);
      localStorage.setItem('raktareach_donor_session', JSON.stringify(res));
      localStorage.setItem('raktareach_role', 'donor');
      setSuccessMsg(res.message || 'Signed in successfully!');
      setTimeout(() => {
        router.push('/donor');
      }, 1200);
    } catch (err: any) {

      setError(err.message || 'Unable to sign in. Please verify your details or register.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.display_name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regData.phone.trim()) {
      setError('Please enter your mobile phone number.');
      return;
    }
    if (!regData.health_declared) {
      setError('Please confirm the voluntary blood donation medical declaration.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.registerDonor({
        display_name: regData.display_name.trim(),
        phone: regData.phone.trim(),
        email: regData.email.trim() || undefined,
        blood_group: regData.blood_group,
        city: regData.city,
        area: regData.area.trim(),
        opt_in_alerts: regData.opt_in_alerts,
        map_discoverable: regData.map_discoverable
      });

      localStorage.setItem('bloodlink_donor_id', res.donor_id);
      localStorage.setItem('bloodlink_donor_session', JSON.stringify(res));
      localStorage.setItem('bloodlink_role', 'donor');
      localStorage.setItem('raktareach_donor_id', res.donor_id);
      localStorage.setItem('raktareach_donor_session', JSON.stringify(res));
      localStorage.setItem('raktareach_role', 'donor');
      setSuccessMsg('Registration successful! Twilio SMS and Voice alerts are active.');
      setTimeout(() => {
        router.push('/donor');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to register donor. Please check the details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (phone: string) => {
    setLoginIdentifier(phone);
    setError(null);
    setLoading(true);
    api.loginDonor(phone)
      .then((res: any) => {
        localStorage.setItem('bloodlink_donor_id', res.donor_id);
        localStorage.setItem('bloodlink_donor_session', JSON.stringify(res));
        localStorage.setItem('bloodlink_role', 'donor');
        localStorage.setItem('raktareach_donor_id', res.donor_id);
        localStorage.setItem('raktareach_donor_session', JSON.stringify(res));
        localStorage.setItem('raktareach_role', 'donor');
        setSuccessMsg(`Welcome, ${res.display_name}!`);
        setTimeout(() => {
          router.push('/donor');
        }, 800);
      })
      .catch((err: any) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };


  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-700 text-white shadow-xl shadow-rose-600/30 mb-2">
            <Heart className="w-8 h-8 fill-white/90 stroke-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            BloodLink Donor Portal
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Connect your phone number to receive real-time emergency hospital alerts, automated Twilio SMS dispatches, and QR pass coordinates.
          </p>

        </div>

        {/* Live Twilio Integration Banner */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-xs text-rose-950 flex-1">
            <div className="font-bold flex items-center space-x-2">
              <span>Twilio Automated Emergency Dispatch</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Online
              </span>
            </div>
            <p className="text-rose-800/90 text-[11px] mt-0.5">
              Hospitals automatically send high-priority SMS alerts and telephone calls to your phone when a compatible transfusion case is logged.
            </p>
          </div>
        </div>

        {/* Active Session Notification */}
        {currentDonor && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                {currentDonor.blood_group}
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  Signed in as {currentDonor.display_name}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {currentDonor.phone} • {currentDonor.donor_code}
                </p>
              </div>
            </div>
            <Link
              href="/donor"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors inline-flex items-center space-x-1"
            >
              <span>Go to Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Auth Box */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🔑 Sign In with Phone / Code
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              📝 Register as Donor
            </button>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number or Donor Code
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="+917587769823 or CG-DONOR-1042"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter with country code, e.g. <span className="font-mono text-slate-600">+917587769823</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blood-700 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/20 hover:from-blood-800 hover:to-rose-700 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Donor Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Demo Sign-In Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Demo Accounts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('+917587769823')}
                    className="p-2.5 rounded-xl border border-slate-200 text-left hover:border-rose-400 hover:bg-rose-50/50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">Rahul Verma</p>
                      <p className="text-[10px] text-slate-500 font-mono">+917587769823 (O+)</p>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                      Demo
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('priya.donor@gmail.com')}
                    className="p-2.5 rounded-xl border border-slate-200 text-left hover:border-rose-400 hover:bg-rose-50/50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800">Priya Sengupta</p>
                      <p className="text-[10px] text-slate-500 font-mono">Bhilai (B+)</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Bhilai
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regData.display_name}
                    onChange={(e) => setRegData({ ...regData, display_name: e.target.value })}
                    placeholder="e.g. Shreyash Verma"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Phone (Twilio Alert)
                  </label>
                  <input
                    type="text"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="+917587769823"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 font-mono focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={regData.blood_group}
                    onChange={(e) => setRegData({ ...regData, blood_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    District / City
                  </label>
                  <select
                    value={regData.city}
                    onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                  >
                    {CG_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Area / Locality */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={regData.area}
                    onChange={(e) => setRegData({ ...regData, area: e.target.value })}
                    placeholder="e.g. Shankar Nagar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="donor@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regData.opt_in_alerts}
                    onChange={(e) => setRegData({ ...regData, opt_in_alerts: e.target.checked })}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>
                    <strong>Enable Emergency Alerts:</strong> Receive Twilio SMS and Voice Calls when an urgent hospital request matches your blood group.
                  </span>
                </label>

                <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regData.map_discoverable}
                    onChange={(e) => setRegData({ ...regData, map_discoverable: e.target.checked })}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>
                    <strong>Regional Radius Matching:</strong> Allow emergency command centers to match within 5-25 km radius (identity and exact address remain strictly protected).
                  </span>
                </label>

                <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regData.health_declared}
                    onChange={(e) => setRegData({ ...regData, health_declared: e.target.checked })}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    required
                  />
                  <span>
                    <strong>Self-Declaration:</strong> I confirm that I am aged 18-65, weigh above 45kg, and volunteer for blood donation coordination.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blood-700 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-900/20 hover:from-blood-800 hover:to-rose-700 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/donor"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center space-x-1"
          >
            <span>← Return to Public Donor Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
