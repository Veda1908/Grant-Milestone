import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  PlusCircle, 
  FolderKanban, 
  CheckCircle2, 
  ArrowRight,
  X
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Grant, UserProfile } from '../types/soa';
import { formatRupees } from '../utils/formatters';

interface GrantsTabProps {
  currentUser: UserProfile;
  onSelectGrant: (grantId: string) => void;
}

export const GrantsTab: React.FC<GrantsTabProps> = ({ currentUser, onSelectGrant }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [org, setOrg] = useState('');
  const [applicant, setApplicant] = useState('');
  const [m1Title, setM1Title] = useState('Laboratory Prototype Validation');
  const [m1Amount, setM1Amount] = useState('600000');
  const [m2Title, setM2Title] = useState('Pilot Field Trial');
  const [m2Amount, setM2Amount] = useState('800000');
  const [m3Title, setM3Title] = useState('Commercial Scale Deployment');
  const [m3Amount, setM3Amount] = useState('1000000');

  const isApplicant = currentUser.role === 'grantee';
  const isApprover = currentUser.role === 'grantReviewer';
  const isGuest = currentUser.role === 'unauthorized';

  const visibleGrants = isApplicant
    ? simulationEngine.grants.filter(
        (g) =>
          g.granteeId === currentUser.id ||
          currentUser.allowedGrantIds.includes('*') ||
          currentUser.allowedGrantIds.includes(g.id) ||
          g.granteeName === currentUser.name
      )
    : simulationEngine.grants;

  const activeGrantId = simulationEngine.selectedGrantId;

  const handleCreateGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isApplicant) return;

    simulationEngine.createGrant(
      title,
      org || currentUser.organization,
      applicant || currentUser.name,
      [
        { title: m1Title, description: 'Phase 1 technical benchmark.', trancheAmount: parseInt(m1Amount, 10) || 500000 },
        { title: m2Title, description: 'Phase 2 pilot operation.', trancheAmount: parseInt(m2Amount, 10) || 750000 },
        { title: m3Title, description: 'Phase 3 final clearance.', trancheAmount: parseInt(m3Amount, 10) || 1000000 }
      ]
    );

    setCreateModalOpen(false);
    setTitle('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-800">
            {isApplicant && 'Applicant Grants Portfolio'}
            {isApprover && 'Supervisory Oversight Portfolio'}
            {isGuest && 'Public Directory (Guest Mode)'}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {isApplicant && 'My Research Grants'}
            {isApprover && 'Grants Under Supervision'}
            {isGuest && 'Research Grants Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isApplicant && 'Manage your registered research proposals, monitor tranche funding status, and create new grant requests.'}
            {isApprover && 'Supervise accredited institutional research projects, evaluate milestone delivery progress, and audit fund releases.'}
            {isGuest && 'Public directory of approved research schemes. Unauthenticated visitors have read-only access.'}
          </p>
        </div>

        {/* Action / Badge depending on role */}
        {isApplicant && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Grant Request</span>
          </button>
        )}

        {isApprover && (
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-xs self-start sm:self-auto">
            <span className="text-[11px] text-emerald-800 font-semibold block">Supervising Committee</span>
            <span className="text-slate-700 font-medium">{visibleGrants.length} Active Grants Monitored</span>
          </div>
        )}

        {isGuest && (
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-600 font-medium self-start sm:self-auto">
            Guest Access · Read-Only
          </div>
        )}
      </div>

      {/* Grants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleGrants.map((grant) => {
          const isSelected = grant.id === activeGrantId;
          const pct = grant.totalGrantAmount > 0 
            ? Math.round((grant.disbursedAmount / grant.totalGrantAmount) * 100)
            : 0;
          const grantMilestones = simulationEngine.milestones.filter((m) => m.grantId === grant.id);
          const pendingReviewCount = grantMilestones.filter((m) => m.status === 'EVIDENCE_SUBMITTED').length;

          return (
            <div
              key={grant.id}
              onClick={() => {
                simulationEngine.selectGrant(grant.id);
                onSelectGrant(grant.id);
              }}
              className={`bg-white p-5 rounded-xl border cursor-pointer transition shadow-sm space-y-3 ${
                isSelected
                  ? 'border-emerald-500 ring-1 ring-emerald-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-emerald-800">{grant.grantCode}</span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {grant.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{grant.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{grant.organization}</span>
                  <span>·</span>
                  <span>Lead: {grant.granteeName}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Disbursed: <strong className="text-slate-900">{formatRupees(grant.disbursedAmount)}</strong></span>
                  <span className="tabular-nums font-semibold">{formatRupees(grant.totalGrantAmount)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  {grantMilestones.length} Milestones Scheduled
                  {isApprover && pendingReviewCount > 0 && (
                    <span className="ml-2 font-semibold text-amber-700">
                      ({pendingReviewCount} pending review)
                    </span>
                  )}
                </span>
                {isSelected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active in Workspace
                  </span>
                ) : (
                  <span className="text-slate-500 hover:text-emerald-700 flex items-center gap-1">
                    {isApprover ? 'Inspect Milestones' : 'Select Grant'} <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Grant */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Create a New Grant Scheme
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter research project information and configure tranche amounts in Indian Rupees (₹).
            </p>

            <form onSubmit={handleCreateGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grant Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIIMS Nanotechnology Biomedical Sensors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="e.g. IIT Bombay"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Researcher</label>
                  <input
                    type="text"
                    value={applicant}
                    onChange={(e) => setApplicant(e.target.value)}
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">3 Milestones & Tranches (INR ₹):</span>
                <div className="space-y-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={m1Title}
                      onChange={(e) => setM1Title(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={m1Amount}
                      onChange={(e) => setM1Amount(e.target.value)}
                      className="w-28 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right"
                    />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={m2Title}
                      onChange={(e) => setM2Title(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={m2Amount}
                      onChange={(e) => setM2Amount(e.target.value)}
                      className="w-28 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right"
                    />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={m3Title}
                      onChange={(e) => setM3Title(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={m3Amount}
                      onChange={(e) => setM3Amount(e.target.value)}
                      className="w-28 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm transition"
                >
                  Create & Save Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
