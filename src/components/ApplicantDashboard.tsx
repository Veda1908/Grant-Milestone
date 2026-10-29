import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  Upload, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  ArrowRight,
  FolderOpen,
  Calendar,
  Send,
  X,
  IndianRupee,
  Building2,
  Check
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Milestone, UserProfile } from '../types/soa';
import { formatRupees } from '../utils/formatters';

interface ApplicantDashboardProps {
  currentUser: UserProfile;
  onNavigateToView: (view: any) => void;
  onOpenCreateGrant: () => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  currentUser,
  onNavigateToView,
  onOpenCreateGrant
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  // Evidence Form
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceMetrics, setEvidenceMetrics] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const grant = simulationEngine.activeGrant;
  const milestones = simulationEngine.activeMilestones;
  const tranches = simulationEngine.activeTranches;
  const grants = simulationEngine.grants;

  const totalGrantAmount = grant ? grant.totalGrantAmount : 0;
  const fundsReleased = grant ? grant.disbursedAmount : 0;
  
  // Available for release = tranches that are AUTHORIZED (Ready for release)
  const readyTranches = tranches.filter((t) => t.status === 'AUTHORIZED');
  const fundsAvailableForRelease = readyTranches.reduce((sum, t) => sum + t.amount, 0);
  const pendingMilestonesCount = milestones.filter((m) => m.status !== 'APPROVED').length;

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 6000);
  };

  const handleOpenEvidenceModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setEvidenceTitle(`Milestone ${milestone.milestoneNumber} Completion Report`);
    setEvidenceDescription(`Submission of experimental verification, laboratory logbook, and deliverables.`);
    setEvidenceMetrics(`All benchmark criteria (>85% efficiency, certified purity) achieved.`);
    setEvidenceModalOpen(true);
  };

  const handleSubmitEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    const res = simulationEngine.submitEvidence(
      selectedMilestone.id,
      evidenceTitle,
      evidenceDescription,
      evidenceMetrics
    );

    if (res.success) {
      showAlert('Evidence submitted successfully. Your submission is now awaiting reviewer approval.', 'success');
      setEvidenceModalOpen(false);
    } else {
      showAlert(res.message, 'error');
    }
  };

  const disbursedPct = totalGrantAmount > 0 ? Math.round((fundsReleased / totalGrantAmount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Notice */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border shadow-sm ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Grant Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Applicant Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your research grants, submit milestone evidence, and track fund releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={grant?.id}
            onChange={(e) => simulationEngine.selectGrant(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium shadow-sm"
          >
            {grants.map((g) => (
              <option key={g.id} value={g.id}>
                {g.grantCode} - {g.title.substring(0, 36)}...
              </option>
            ))}
          </select>

          <button
            onClick={onOpenCreateGrant}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Grant</span>
          </button>
        </div>
      </div>

      {/* 1. Four Simple Summary Cards (Requirement 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Grant Amount */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Grant Amount</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatRupees(totalGrantAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sanctioned for this project</span>
        </div>

        {/* Card 2: Funds Released */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Funds Released
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatRupees(fundsReleased)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{disbursedPct}% of total allocation</span>
        </div>

        {/* Card 3: Funds Available for Release */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-indigo-700 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Ready for Release
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {formatRupees(fundsAvailableForRelease)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Approved installments</span>
        </div>

        {/* Card 4: Pending Milestones */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Pending Milestones
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {pendingMilestonesCount} / {milestones.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting completion/review</span>
        </div>
      </div>

      {/* Grant Overview & Progress Card */}
      {grant && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-mono text-emerald-700 font-semibold">{grant.grantCode}</span>
                <span>·</span>
                <span>Status: <strong className="text-slate-700">{grant.status}</strong></span>
                <span>·</span>
                <span>{grant.startDate} to {grant.endDate}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{grant.title}</h2>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{grant.organization}</span>
                <span>·</span>
                <span>Researcher: <strong>{grant.granteeName}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigateToView('fund_releases')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <span>View Fund Releases</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Overall Funding Released</span>
              <span className="font-semibold text-slate-900">{formatRupees(fundsReleased)} of {formatRupees(totalGrantAmount)} ({disbursedPct}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${disbursedPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Compact Milestone Cards (Requirement 4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Project Milestones</h2>
            <p className="text-xs text-slate-500">
              Submit proof and deliverables for each milestone to qualify for fund release.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone) => {
            const tranche = tranches.find((t) => t.id === milestone.trancheId);
            const isApproved = milestone.status === 'APPROVED';
            const isSubmitted = milestone.status === 'EVIDENCE_SUBMITTED';
            const isReleased = tranche?.status === 'DISBURSED';
            const isReady = tranche?.status === 'AUTHORIZED';
            const isExpanded = expandedMilestoneId === milestone.id;

            // Simplified funding status
            const fundingStatusLabel = isReleased
              ? 'Released'
              : isReady
              ? 'Ready for Release'
              : 'Locked';

            return (
              <div
                key={milestone.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Number, Title, Due Date */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        Milestone {milestone.milestoneNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {milestone.targetDate}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {milestone.title}
                    </h3>

                    {/* Status Badges in simple plain text */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
                      <span className="text-slate-600">
                        Evidence: <strong className={isSubmitted || isApproved ? 'text-emerald-700' : 'text-slate-700'}>
                          {isApproved ? 'Verified' : isSubmitted ? 'Submitted' : 'Pending'}
                        </strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600">
                        Approval: <strong className={isApproved ? 'text-emerald-700' : 'text-slate-700'}>
                          {isApproved ? 'Approved' : isSubmitted ? 'Under Review' : 'Not Started'}
                        </strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600">
                        Funding: <strong className={
                          isReleased ? 'text-emerald-700' : isReady ? 'text-indigo-700' : 'text-slate-500'
                        }>
                          {fundingStatusLabel}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Amount & One Relevant Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Installment</div>
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {formatRupees(milestone.trancheAmount)}
                      </div>
                    </div>

                    {/* One relevant action button (APPLICANT: Submit Evidence or View Details) */}
                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Approved
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-xs text-indigo-700 font-medium flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                          <Clock className="w-3.5 h-3.5" />
                          Under Review
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenEvidenceModal(milestone)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition flex items-center gap-1 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit Evidence</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedMilestoneId(isExpanded ? null : milestone.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50"
                        title="Toggle full details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Section for long descriptions & deliverables (Requirement 4) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 bg-slate-50 p-3 rounded-lg">
                    <div>
                      <span className="font-semibold text-slate-700">Detailed Description:</span>
                      <p className="text-slate-600 mt-0.5">{milestone.description}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700">Required Deliverables:</span>
                      <ul className="list-disc list-inside text-slate-600 mt-0.5 space-y-0.5">
                        {milestone.deliverables.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    {isApproved && (
                      <div className="text-emerald-700 pt-1 font-medium">
                        Approved on {milestone.approvedAt ? new Date(milestone.approvedAt).toLocaleDateString() : 'recent date'}. Associated funding is {fundingStatusLabel.toLowerCase()}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Submit Evidence */}
      {evidenceModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <button
              onClick={() => setEvidenceModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submit Evidence: Milestone {selectedMilestone.milestoneNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedMilestone.title} ({formatRupees(selectedMilestone.trancheAmount)})
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submitted Project Report Title *
                </label>
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Summary & Test Results *
                </label>
                <textarea
                  rows={3}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  KPIs Achieved
                </label>
                <input
                  type="text"
                  value={evidenceMetrics}
                  onChange={(e) => setEvidenceMetrics(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Document Upload:</span> Attachment will be cryptographically registered in the review database for reviewer verification.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
