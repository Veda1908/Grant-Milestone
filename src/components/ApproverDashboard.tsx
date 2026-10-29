import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Check, 
  X, 
  Send, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Milestone, UserProfile } from '../types/soa';
import { formatRupees } from '../utils/formatters';
import { fireReleaseConfetti } from '../utils/confetti';

interface ApproverDashboardProps {
  currentUser: UserProfile;
  onNavigateToView: (view: any) => void;
}

export const ApproverDashboard: React.FC<ApproverDashboardProps> = ({
  currentUser,
  onNavigateToView
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewComments, setReviewComments] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const allMilestones = simulationEngine.milestones;
  const pendingReviews = allMilestones.filter((m) => m.status === 'EVIDENCE_SUBMITTED');
  const approvedMilestones = allMilestones.filter((m) => m.status === 'APPROVED');
  const allGrants = simulationEngine.grants;
  const decisions = simulationEngine.reviewerDecisions;
  const evidenceSubmissions = simulationEngine.evidenceSubmissions;

  const totalFundsAuthorized = approvedMilestones.reduce((sum, m) => sum + m.trancheAmount, 0);

  const showAlert = (text: string, type: 'success' | 'error' | 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 6000);
  };

  const handleDirectApprove = (milestone: Milestone) => {
    const res = simulationEngine.reviewMilestone(
      milestone.id,
      'APPROVE',
      'Verified all submitted deliverables, spectrometer readings, and compliance certificates against grant terms. Approved for installment release.'
    );

    if (res.success) {
      fireReleaseConfetti();
      showAlert(
        `Milestone approved successfully. Associated installment of ${formatRupees(milestone.trancheAmount)} is now ready for release.`,
        'success'
      );
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleOpenReviewModal = (milestone: Milestone, mode: 'APPROVE' | 'REJECT') => {
    setSelectedMilestone(milestone);
    setDecisionMode(mode);
    setReviewComments(
      mode === 'APPROVE'
        ? 'Verified all submitted deliverables, spectrometer readings, and compliance certificates against grant terms. Approved for installment release.'
        : 'Submitted results do not satisfy threshold requirements. Revision required.'
    );
    setReviewModalOpen(true);
  };

  const handleRecordDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    const res = simulationEngine.reviewMilestone(
      selectedMilestone.id,
      decisionMode,
      reviewComments
    );

    if (res.success) {
      if (decisionMode === 'APPROVE') {
        fireReleaseConfetti();
        showAlert(
          `Milestone approved successfully. Associated installment of ${formatRupees(selectedMilestone.trancheAmount)} is now ready for release.`,
          'success'
        );
      } else {
        showAlert('Milestone was rejected with reviewer feedback sent to applicant.', 'info');
      }
      setReviewModalOpen(false);
    } else {
      showAlert(res.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Notice */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border shadow-sm ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : alertMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : alertMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-700">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Approver Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate submitted research deliverables, record independent review decisions, and authorize fund release eligibility.
          </p>
        </div>

        <button
          onClick={() => onNavigateToView('pending_reviews')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pending Milestone Reviews ({pendingReviews.length})</span>
        </button>
      </div>

      {/* Four Summary Cards for Approver */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending Reviews
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {pendingReviews.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting official review</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Grants Monitored</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {allGrants.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active research projects</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Funds Qualified
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatRupees(totalFundsAuthorized)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across approved milestones</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="text-xs text-indigo-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Decisions Recorded
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {decisions.length + approvedMilestones.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Audited reviews</span>
        </div>
      </div>

      {/* Pending Evidence Reviews Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Deliverables Awaiting Review
            </h2>
            <p className="text-xs text-slate-500">
              Independent sign-off activates fund installment eligibility for the associated tranche only.
            </p>
          </div>

          <button
            onClick={() => onNavigateToView('pending_reviews')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
          >
            <span>View All Pending</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-sm">
            No milestones currently waiting for review. When an applicant submits deliverable evidence, it will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((milestone) => {
              const evidence = evidenceSubmissions.find((e) => e.milestoneId === milestone.id);
              const parentGrant = allGrants.find((g) => g.id === milestone.grantId);

              return (
                <div
                  key={milestone.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">Milestone {milestone.milestoneNumber}</span>
                        <span>·</span>
                        <span className="font-mono text-emerald-700">{parentGrant?.grantCode}</span>
                        <span>·</span>
                        <span>Due: {milestone.targetDate}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{milestone.title}</h3>
                      <p className="text-xs text-slate-600">{milestone.description}</p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-slate-500 block">Associated Tranche</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatRupees(milestone.trancheAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Evidence Document Preview */}
                  {evidence && (
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-700 font-medium">
                        <span className="flex items-center gap-1.5 text-indigo-700">
                          <FileText className="w-3.5 h-3.5" />
                          Submitted Document: {evidence.title}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          By {evidence.submittedBy}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{evidence.description}</p>
                      <div className="text-emerald-700 font-medium text-[11px]">
                        Reported KPIs: {evidence.metricsAchieved}
                      </div>
                    </div>
                  )}

                  {/* Approver Action Buttons (Requirement 4: Green Approve & Red Reject) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenReviewModal(milestone, 'REJECT')}
                      className="bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-xs font-medium px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleDirectApprove(milestone)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Milestone</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Record Independent Review Decision
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Milestone {selectedMilestone.milestoneNumber}: {selectedMilestone.title} ({formatRupees(selectedMilestone.trancheAmount)})
            </p>

            <form onSubmit={handleRecordDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Review Decision:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionMode('APPROVE')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionMode === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Milestone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionMode('REJECT')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionMode === 'REJECT'
                        ? 'bg-rose-50 border-rose-500 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Reject / Request Changes</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Verification Notes & Comments *
                </label>
                <textarea
                  rows={4}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition text-white shadow-sm ${
                    decisionMode === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
