import React, { useState } from 'react';
import { 
  Plus, 
  Building, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  FileText,
  AlertCircle,
  X
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';
import { Grant } from '../types/soa';

interface MyGrantsViewProps {
  onSelectGrant?: (grantId: string) => void;
  onNavigateToMilestones?: () => void;
}

export const MyGrantsView: React.FC<MyGrantsViewProps> = ({ 
  onSelectGrant,
  onNavigateToMilestones 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const grants = simulationEngine.grants;
  const currentGrant = simulationEngine.activeGrant;

  // Create Grant Form State
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState(simulationEngine.currentUser.organization || 'IISc Bangalore');
  const [applicantName, setApplicantName] = useState(simulationEngine.currentUser.name || 'Dr. Priya Sharma');
  const [m1Amount, setM1Amount] = useState<number>(750000);
  const [m2Amount, setM2Amount] = useState<number>(1000000);
  const [m3Amount, setM3Amount] = useState<number>(1250000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a grant project title.');
      return;
    }
    if (m1Amount <= 0 || m2Amount <= 0 || m3Amount <= 0) {
      setErrorMsg('All milestone tranches must have a positive funding amount.');
      return;
    }

    const configs = [
      {
        title: 'Phase 1: Proof of Concept & Initial Validation',
        description: 'Establish theoretical framework, architecture design, and initial hardware bench tests.',
        trancheAmount: Number(m1Amount)
      },
      {
        title: 'Phase 2: Pilot Implementation & Verification',
        description: 'Complete pilot deployment in live testing conditions and produce verification data logs.',
        trancheAmount: Number(m2Amount)
      },
      {
        title: 'Phase 3: Final Production & Impact Assessment',
        description: 'Full-scale deployment, institutional audit verification, and final compliance sign-off.',
        trancheAmount: Number(m3Amount)
      }
    ];

    const result = simulationEngine.createGrant(title, organization, applicantName, configs);
    if (result.success) {
      setShowCreateModal(false);
      setTitle('');
      setErrorMsg(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Grants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your registered research grants, funding tranches, and milestone delivery schedules.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Grant</span>
        </button>
      </div>

      {/* Grants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grants.map((grant) => {
          const isSelected = grant.id === currentGrant?.id;
          const tranches = simulationEngine.tranches.filter((t) => t.grantId === grant.id);
          const milestones = simulationEngine.milestones.filter((m) => m.grantId === grant.id);
          const completedCount = milestones.filter((m) => m.status === 'APPROVED').length;
          const progressPercent = Math.round((completedCount / (milestones.length || 1)) * 100);

          return (
            <div
              key={grant.id}
              className={`bg-white rounded-xl border transition p-5 flex flex-col justify-between ${
                isSelected 
                  ? 'border-emerald-300 ring-2 ring-emerald-600/10 shadow-xs' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {grant.grantCode}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    grant.status === 'ACTIVE' 
                      ? 'bg-slate-100 text-slate-700' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {grant.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {grant.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{grant.organization}</span>
                  <span className="text-slate-300">·</span>
                  <span>{grant.granteeName}</span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Funding</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {formatRupees(grant.totalGrantAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Disbursed</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {formatRupees(grant.disbursedAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Milestones Completed</span>
                    <span className="font-medium">{completedCount} of {milestones.length} ({progressPercent}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    simulationEngine.selectedGrantId = grant.id;
                    if (onSelectGrant) onSelectGrant(grant.id);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? '✓ Active Selection' : 'Select Grant'}
                </button>

                <button
                  onClick={() => {
                    simulationEngine.selectedGrantId = grant.id;
                    if (onNavigateToMilestones) onNavigateToMilestones();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>View Milestones</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Grant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create New Research Grant</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="space-y-4 mt-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Grant Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indigenous Solid-State Battery Deployment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institution / Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Principal Investigator
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Milestone Tranches (INR) */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  Milestone Tranches Allocation (Indian Rupees ₹)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Milestone 1</label>
                    <input
                      type="number"
                      step="10000"
                      value={m1Amount}
                      onChange={(e) => setM1Amount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Milestone 2</label>
                    <input
                      type="number"
                      step="10000"
                      value={m2Amount}
                      onChange={(e) => setM2Amount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Milestone 3</label>
                    <input
                      type="number"
                      step="10000"
                      value={m3Amount}
                      onChange={(e) => setM3Amount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-semibold text-slate-700">
                  Total Grant Amount: <span className="font-mono text-emerald-700 font-bold">{formatRupees(m1Amount + m2Amount + m3Amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Register Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
