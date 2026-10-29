import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  FileCheck,
  Building,
  Download
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const grants = simulationEngine.grants;
  const milestones = simulationEngine.milestones;
  const tranches = simulationEngine.tranches;
  const decisions = simulationEngine.reviewerDecisions;

  const totalCommitted = grants.reduce((sum, g) => sum + g.totalGrantAmount, 0);
  const totalDisbursed = tranches
    .filter((t) => t.status === 'DISBURSED')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAuthorized = tranches
    .filter((t) => t.status === 'AUTHORIZED')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalLocked = tranches
    .filter((t) => t.status === 'LOCKED' || t.status === 'HELD')
    .reduce((sum, t) => sum + t.amount, 0);

  const approvedMilestones = milestones.filter((m) => m.status === 'APPROVED').length;
  const pendingMilestones = milestones.filter((m) => m.status === 'EVIDENCE_SUBMITTED').length;
  const inProgressMilestones = milestones.filter((m) => m.status === 'PENDING_EVIDENCE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Grant Portfolio Reports & Governance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated performance metrics, tranche disbursement rates, and reviewer audit summary.
          </p>
        </div>

        <button 
          onClick={() => {
            alert('Report exported: grant-portfolio-audit-summary.csv');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Summary (CSV)</span>
        </button>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total Committed Funding</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{formatRupees(totalCommitted)}</span>
          <span className="text-[11px] text-slate-400 block mt-1">{grants.length} Active Grants</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Disbursed to Date</span>
          <span className="text-xl font-bold text-emerald-700 font-mono">{formatRupees(totalDisbursed)}</span>
          <span className="text-[11px] text-slate-400 block mt-1">{Math.round((totalDisbursed / (totalCommitted || 1)) * 100)}% of total portfolio</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Approved & Ready to Disburse</span>
          <span className="text-xl font-bold text-blue-700 font-mono">{formatRupees(totalAuthorized)}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Milestones verified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Locked Until Approval</span>
          <span className="text-xl font-bold text-slate-700 font-mono">{formatRupees(totalLocked)}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Pending future evidence</span>
        </div>
      </div>

      {/* Breakdown Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone Status Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Milestone Completion Distribution</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Approved & Verified</span>
                <span className="font-semibold text-emerald-700">{approvedMilestones} milestones</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full" 
                  style={{ width: `${(approvedMilestones / (milestones.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Under Independent Review</span>
                <span className="font-semibold text-amber-700">{pendingMilestones} milestones</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${(pendingMilestones / (milestones.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-600 mb-1">
                <span>Awaiting Evidence Submission</span>
                <span className="font-semibold text-slate-700">{inProgressMilestones} milestones</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-400 rounded-full" 
                  style={{ width: `${(inProgressMilestones / (milestones.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Grants Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Institutional Allocation Breakdown</span>
          </h2>

          <div className="space-y-3">
            {grants.map((g) => (
              <div key={g.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{g.organization}</span>
                  <span className="text-[11px] text-slate-500 truncate block max-w-[240px]">{g.title}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 font-mono block">{formatRupees(g.totalGrantAmount)}</span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {formatRupees(g.disbursedAmount)} released
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
