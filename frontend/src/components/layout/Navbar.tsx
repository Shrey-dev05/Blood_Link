'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Heart, Building2, MapPin, Calendar, Activity, ChevronDown
} from 'lucide-react';
import { UserRole } from '@/types';

const ROLES: { id: UserRole; label: string; desc: string; defaultRoute: string }[] = [
  { id: 'hospital_staff', label: 'Hospital Command', desc: 'Ambedkar Hospital Raipur', defaultRoute: '/hospital' },
  { id: 'donor', label: 'Donor Hub', desc: 'Rahul Verma (O+ Verified)', defaultRoute: '/donor' },
  { id: 'blood_bank_staff', label: 'Blood Bank', desc: 'Arogya Blood Centre Raipur', defaultRoute: '/blood-bank' },
  { id: 'public', label: 'Patient Family Tracker', desc: 'Live Case Status', defaultRoute: '/patient' },
];

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>('hospital_staff');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  useEffect(() => {
    const savedRole = (localStorage.getItem('bloodlink_role') || localStorage.getItem('raktareach_role')) as UserRole;
    if (savedRole && ROLES.some(r => r.id === savedRole)) {
      setCurrentRole(savedRole);
    }
  }, []);

  const switchRole = (role: (typeof ROLES)[0]) => {
    setCurrentRole(role.id);
    localStorage.setItem('bloodlink_role', role.id);
    localStorage.setItem('raktareach_role', role.id);
    setIsRoleMenuOpen(false);
    router.push(role.defaultRoute);
  };


  const activeRoleMeta = ROLES.find(r => r.id === currentRole) || ROLES[0];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blood-700 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blood-700 transition-colors">
                  Blood<span className="text-blood-600">Link</span>
                </span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                  Chhattisgarh Emergency Network
                </span>
              </div>
            </Link>

          </div>

          {/* Clean Primary Navigation */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-semibold">
            <Link 
              href="/hospital" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/hospital')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Hospital Command
            </Link>
            <Link 
              href="/donor" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/donor')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Donor Hub
            </Link>
            <Link 
              href="/patient" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/patient')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Family Tracker
            </Link>
            <Link 
              href="/blood-bank" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/blood-bank')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Blood Banks
            </Link>
            <Link 
              href="/camps" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/camps')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Donation Camps
            </Link>
            <Link 
              href="/map" 
              className={`px-3.5 py-2 rounded-xl transition-all ${
                pathname.startsWith('/map')
                  ? 'bg-blood-50 text-blood-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Live Map
            </Link>
          </nav>

          {/* Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 transition-all text-left shadow-xs"
              title="Switch user perspective"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse"></div>
              <div className="text-xs">
                <span className="block font-bold text-slate-900">{activeRoleMeta.label}</span>
                <span className="block text-[10px] text-slate-500 truncate max-w-[130px]">{activeRoleMeta.desc}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 divide-y divide-slate-100">
                <div className="px-4 py-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active View
                  </p>
                </div>
                <div className="py-1">
                  {ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => switchRole(role)}
                      className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-rose-50/60 transition-colors ${
                        currentRole === role.id ? 'bg-rose-50 text-blood-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{role.label}</div>
                        <div className="text-[11px] text-slate-500">{role.desc}</div>
                      </div>
                      {currentRole === role.id && (
                        <span className="text-xs text-blood-600 font-bold">Active</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-slate-50">
                  <Link
                    href="/donor/auth"
                    onClick={() => setIsRoleMenuOpen(false)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-blood-700 to-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm hover:from-blood-800 hover:to-rose-700 transition-colors"
                  >
                    <span>🔑 Donor Sign In / Register</span>
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
