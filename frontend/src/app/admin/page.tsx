'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, Database, FileText, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Layers, Shield
} from 'lucide-react';
import { api } from '@/lib/api';
import { Organization } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orgs' | 'sync' | 'audit'>('orgs');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [orgs, sources, logs] = await Promise.all([
        api.getAllOrganizations(),
        api.getDataSourcesStatus(),
        api.getAuditLogs()
      ]);
      setOrganizations(orgs);
      setDataSources(sources);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyOrg = async (orgId: string, status: string) => {
    try {
      await api.verifyOrganization(orgId, status);
      loadData();
      alert(`Organization status updated to ${status}!`);
    } catch (err: any) {
      alert(`Error verifying organization: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Shield className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                Governance & Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Organization verification, external integration health, and immutable audit logs
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Governance State</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {[
          { id: 'orgs', label: 'Organization Verification Queue' },
          { id: 'sync', label: 'Data Source Integrations' },
          { id: 'audit', label: 'Immutable Audit Trail' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Organizations */}
      {activeTab === 'orgs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Hospital & Blood Bank Registrations</h2>
            <p className="text-xs text-slate-500">Facilities must be verified before broad emergency broadcasts are permitted.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Organization</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">License Number</th>
                  <th className="py-3 px-6">Location</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{org.name}</div>
                      <div className="text-[11px] text-slate-500">{org.contact_phone}</div>
                    </td>
                    <td className="py-4 px-6 uppercase font-semibold text-slate-700 text-xs">
                      {org.type.replace('_', ' ')}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {org.license_number || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      {org.city}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={org.verification_status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleVerifyOrg(org.id, 'verified')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerifyOrg(org.id, 'suspended')}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Data Sources */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dataSources.map((ds, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {ds.type}
                  </span>
                  <StatusBadge status={ds.status.includes('ACTIVE') || ds.status.includes('DEMO') ? 'CONFIRMED' : 'STALE'} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900">{ds.source_name}</h3>
                <p className="text-xs text-slate-600">{ds.note}</p>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <div><strong>Last Sync:</strong> {ds.last_sync}</div>
                  <div><strong>Records Ingested:</strong> {ds.records_imported}</div>
                  <div><strong>Provenance:</strong> {ds.provenance}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Immutable Compliance & Audit Log</h2>
            <p className="text-xs text-slate-500">Append-only operational record of emergency requests, matching runs, QR scans, and screening events.</p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start space-x-3 text-xs">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blood-700">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium">{log.details}</div>
                  <div className="text-[10px] text-slate-400">
                    Actor: <strong className="text-slate-600">{log.actor_role}</strong> ({log.actor_id}) • Entity: {log.entity_type} ({log.entity_id})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
