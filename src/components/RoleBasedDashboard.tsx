import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Lock, 
  AlertCircle, 
  Upload, 
  Check, 
  X, 
  Send, 
  Building2, 
  Calendar,
  IndianRupee,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  CheckSquare
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Milestone, Tranche, UserProfile, Grant } from '../types/soa';
import { formatRupees } from '../utils/formatters';

interface RoleBasedDashboardProps {
  currentUser: UserProfile;
  onNavigateToTab: (tab: 'grants' | 'milestones' | 'releases') => void;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({
  currentUser,
  onNavigateToTab
}) => {
  const [, setTick] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decisionModalMode, setDecisionModalMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  // Confirmation Modal State (Fix 1)
  const [confirmApprovalMilestone, setConfirmApprovalMilestone] = useState<Milestone | null>(null);
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);

  // Evidence Form State
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceMetrics, setEvidenceMetrics] = useState('');

  // Review Form State
  const [reviewComments, setReviewComments] = useState('');

  // Notifications
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Real-time synchronization with simulationEngine
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const currentGrant = simulationEngine.activeGrant;
  const milestones = simulationEngine.activeMilestones;
  const tranches = simulationEngine.activeTranches;
  const evidenceList = simulationEngine.evidenceSubmissions;
  const disbursementLedgers = simulationEngine.disbursementLedgers;
  const allGrants = simulationEngine.grants;

  const showAlert = (text: string, type: 'success' | 'error' | 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 6000);
  };

  const handleOpenEvidenceModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    const existingEv = evidenceList.find((e) => e.milestoneId === milestone.id);
    if (existingEv) {
      setEvidenceTitle(existingEv.title);
      setEvidenceDescription(existingEv.description);
      setEvidenceMetrics(existingEv.metricsAchieved);
    } else if (milestone.milestoneNumber === 1) {
      setEvidenceTitle(`Milestone 1 Deliverable Report & Spectrometry Metrics`);
      setEvidenceDescription(`Achieved 88.4% CO₂ capture during testing. The sample purity check was successful.`);
      setEvidenceMetrics(`CO₂ Capture: 88.4% (Target: 85%) | Sample Purity: 99.8%`);
    } else {
      setEvidenceTitle(`Milestone ${milestone.milestoneNumber} Deliverable Report & Field Data`);
      setEvidenceDescription(`Comprehensive operational verification report fulfilling all scheduled milestone deliverables.`);
      setEvidenceMetrics(`All benchmark KPIs achieved (>85% efficiency, zero downtime, validated logbook).`);
    }
    setEvidenceModalOpen(true);
  };

  // Step 1: Open Double-Confirmation Modal
  const handleOpenApprovalConfirmation = (milestone: Milestone) => {
    setConfirmApprovalMilestone(milestone);
  };

  // Step 2: Confirm Approval & Release (No Confetti, Professional Notification)
  const handleConfirmApproval = (milestone: Milestone) => {
    if (isConfirmingApproval) return;
    setIsConfirmingApproval(true);

    const res = simulationEngine.reviewMilestone(
      milestone.id,
      'APPROVE',
      'Official scientific evaluation verified all submitted lab metrics, DNA sequencing, and test data against grant requirements. Approved for immediate tranche fund release.'
    );

    setTimeout(() => {
      setIsConfirmingApproval(false);
      setConfirmApprovalMilestone(null);

      if (res.success) {
        showAlert(
          `Milestone approved. Tranche ${milestone.milestoneNumber} authorized for release.`,
          'success'
        );
      } else {
        showAlert(res.message, 'error');
      }
    }, 200);
  };

  const handleOpenReviewModal = (milestone: Milestone, mode: 'APPROVE' | 'REJECT') => {
    setSelectedMilestone(milestone);
    setDecisionModalMode(mode);
    setReviewComments(
      mode === 'APPROVE'
        ? 'Official scientific evaluation verified all submitted lab metrics, DNA sequencing, and test data against grant requirements. Approved for immediate tranche fund release.'
        : 'Telemetry data shows intermittent flow fluctuations failing stability threshold. Resubmission required.'
    );
    setReviewModalOpen(true);
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
      showAlert(res.message, 'success');
      setEvidenceModalOpen(false);
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleRecordDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    const res = simulationEngine.reviewMilestone(
      selectedMilestone.id,
      decisionModalMode,
      reviewComments
    );

    if (res.success) {
      if (decisionModalMode === 'APPROVE') {
        showAlert(
          `Milestone approved. Tranche ${selectedMilestone.milestoneNumber} authorized for release.`,
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

  // Submissions awaiting reviewer evaluation
  const pendingReviewMilestones = simulationEngine.milestones.filter(
    (m) => m.status === 'EVIDENCE_SUBMITTED'
  );

  // Milestones awaiting applicant's evidence upload
  const pendingEvidenceMilestones = milestones.filter(
    (m) => m.status === 'PENDING_EVIDENCE' || m.status === 'REJECTED'
  );

  // Approved milestones with released tranches
  const approvedMilestones = milestones.filter((m) => m.status === 'APPROVED');

  // Synchronized Totals across Dashboard and Tranches
  const totalAuthorizedOrDisbursed = tranches
    .filter((t) => t.status === 'AUTHORIZED' || t.status === 'DISBURSED')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingLocked = tranches
    .filter((t) => t.status === 'LOCKED' || t.status === 'HELD')
    .reduce((sum, t) => sum + t.amount, 0);

  const disbursedPct = currentGrant && currentGrant.totalGrantAmount > 0 
    ? Math.round((totalAuthorizedOrDisbursed / currentGrant.totalGrantAmount) * 100) 
    : 0;

  // -----------------------------------------------------------------------------------
  // 1. APPLICANT DASHBOARD (Dr. Priya Sharma)
  // -----------------------------------------------------------------------------------
  if (currentUser.role === 'grantee') {
    return (
      <div className="space-y-6 pb-12">
        {/* Toast / Alert */}
        {alertMessage && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{alertMessage.text}</div>
            <button onClick={() => setAlertMessage(null)} className="text-xs text-slate-500 hover:text-slate-800">
              Dismiss
            </button>
          </div>
        )}

        {/* Applicant Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Applicant Portal</div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Welcome back, {currentUser.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.organization}</span>
                <span>·</span>
                <span>Role: Principal Researcher</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('grants')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition shadow-sm self-start sm:self-auto"
            >
              View All Applied Grants
            </button>
          </div>

          {/* Applicant Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">My Active Grants</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {allGrants.length}
              </div>
              <span className="text-[11px] text-slate-500">Government funded research</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Total Funding Awarded</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupees(currentGrant.totalGrantAmount)}
              </div>
              <span className="text-[11px] text-slate-500">INR Allocated</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-emerald-700 font-medium">Funds Authorized / Disbursed</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupees(totalAuthorizedOrDisbursed)}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">{disbursedPct}% budget qualified</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-amber-700 font-medium">Pending Action</span>
              <div className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {pendingEvidenceMilestones.length}
              </div>
              <span className="text-[11px] text-amber-700">Milestones need evidence</span>
            </div>
          </div>
        </div>

        {/* Current Active Grant Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-mono text-emerald-800 font-semibold">{currentGrant.grantCode}</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{currentGrant.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Authorized: <strong className="text-slate-900">{formatRupees(totalAuthorizedOrDisbursed)}</strong> / {formatRupees(currentGrant.totalGrantAmount)}</div>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${disbursedPct}%` }}
            />
          </div>
        </div>

        {/* Section 1: Clean, Shorter Milestone Cards for Applicant */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Milestones & Deliverables Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Upload your research evidence and test reports to unlock scheduled fund tranches.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('milestones')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((milestone) => {
              const tranche = tranches.find((t) => t.id === milestone.trancheId);
              const isDisbursed = tranche?.status === 'DISBURSED';
              const isApproved = milestone.status === 'APPROVED';
              const isSubmitted = milestone.status === 'EVIDENCE_SUBMITTED' || milestone.status === 'UNDER_REVIEW';
              const isRejected = milestone.status === 'REJECTED';
              const isPending = milestone.status === 'PENDING_EVIDENCE';

              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-xl border transition ${
                    isDisbursed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isSubmitted
                      ? 'bg-indigo-50/30 border-indigo-200'
                      : isRejected
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-700">Milestone {milestone.milestoneNumber}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due: {milestone.targetDate}
                        </span>
                        <span className="text-slate-300">·</span>
                        
                        {isDisbursed ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved & Disbursed
                          </span>
                        ) : isApproved ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Milestone Approved
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-indigo-700 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Under Review by Approver
                          </span>
                        ) : isRejected ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Revisions Requested
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            Pending Evidence
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {milestone.title}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {milestone.description}
                      </p>
                    </div>

                    {/* Tranche & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900 tabular-nums">
                          {formatRupees(milestone.trancheAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">Tranche {milestone.milestoneNumber}</div>
                      </div>

                      {isDisbursed ? (
                        <div className="text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Transfer Completed</span>
                        </div>
                      ) : isApproved ? (
                        <button
                          onClick={() => onNavigateToTab('milestones')}
                          className="bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Approved Evidence</span>
                        </button>
                      ) : isRejected ? (
                        <button
                          onClick={() => handleOpenEvidenceModal(milestone)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Revise & Resubmit</span>
                        </button>
                      ) : isSubmitted ? (
                        <button
                          onClick={() => onNavigateToTab('milestones')}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Submitted Evidence</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenEvidenceModal(milestone)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Evidence</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Recent Fund Disbursements */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recent Fund Disbursements
              </h3>
              <p className="text-xs text-slate-500">
                Fund transfer records for completed milestone tranches.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('releases')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
            >
              View All Releases
            </button>
          </div>

          {disbursementLedgers.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 text-xs">
              No fund disbursements received yet. Once the reviewer approves Milestone 1, the tranche funds will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Transaction Reference</th>
                    <th className="py-2.5 px-3">Tranche</th>
                    <th className="py-2.5 px-3">Amount Credited</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {disbursementLedgers.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{l.transactionRef}</td>
                      <td className="py-2.5 px-3 text-emerald-700">{l.trancheId}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">
                        {formatRupees(l.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{new Date(l.releasedAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                          (NEFT Settled) Transfer Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Upload Milestone {selectedMilestone.milestoneNumber} Evidence
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Milestone: <strong className="text-slate-800">{selectedMilestone.title}</strong>
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
                    Work Summary & Laboratory Findings *
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
                    Quantifiable KPIs Achieved *
                  </label>
                  <input
                    type="text"
                    value={evidenceMetrics}
                    onChange={(e) => setEvidenceMetrics(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
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
                    <span>Submit to Reviewer Board</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------------------
  // 2. APPROVER DASHBOARD (Prof. Rajesh Nair)
  // -----------------------------------------------------------------------------------
  if (currentUser.role === 'grantReviewer') {
    return (
      <div className="space-y-6 pb-12">
        {/* Toast / Alert */}
        {alertMessage && (
          <div className="p-4 rounded-xl flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{alertMessage.text}</div>
            <button onClick={() => setAlertMessage(null)} className="text-xs text-slate-500 hover:text-slate-800">
              Dismiss
            </button>
          </div>
        )}

        {/* Approver Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Evaluation & Oversight Portal</div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                Welcome, {currentUser.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentUser.organization}</span>
                <span>·</span>
                <span>Role: Independent Grant Reviewer</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                {pendingReviewMilestones.length} Pending Approval
              </span>
            </div>
          </div>

          {/* Approver Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-amber-700 font-medium">Awaiting Your Review</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {pendingReviewMilestones.length}
              </div>
              <span className="text-[11px] text-amber-700">Reports submitted by applicants</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Grants Under Supervision</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {allGrants.length}
              </div>
              <span className="text-[11px] text-slate-500">Active research portfolios</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-emerald-700 font-medium">Total Funds Authorized</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupees(totalAuthorizedOrDisbursed)}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">{approvedMilestones.length} tranche(s) authorized</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Locked Until Approval</span>
              <div className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {formatRupees(remainingLocked)}
              </div>
              <span className="text-[11px] text-slate-500">Scheduled future milestones</span>
            </div>
          </div>
        </div>

        {/* Section 1: Pending Milestone Reviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pending Milestone Reviews: Submissions Awaiting Sign-Off
              </h3>
              <p className="text-xs text-slate-500">
                Independent evaluation of technical deliverables before fund tranche release.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {pendingReviewMilestones.length} Item(s)
            </span>
          </div>

          {pendingReviewMilestones.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <div className="font-semibold text-slate-700">Inbox is Clear</div>
              <p className="mt-1">All submitted milestone deliverables have been reviewed. No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewMilestones.map((milestone) => {
                const evidence = evidenceList.filter((e) => e.milestoneId === milestone.id);
                const latestEvidence = evidence[0];

                return (
                  <div
                    key={milestone.id}
                    className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900">Milestone {milestone.milestoneNumber}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-indigo-700 font-medium">Grant: {milestone.grantId}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">Submitted by: Dr. Priya Sharma (IISc)</span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900">
                          {milestone.title}
                        </h4>

                        <p className="text-xs text-slate-600">
                          {milestone.description}
                        </p>

                        {/* Milestone Evidence Details Box */}
                        {latestEvidence && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{latestEvidence.title}</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{latestEvidence.description}</p>
                            <div className="text-emerald-700 text-[11px] font-medium">
                              KPIs Reported: {latestEvidence.metricsAchieved}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Review Action Controls */}
                      <div className="lg:w-64 bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between shrink-0">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Tranche Release Amount:</div>
                          <div className="text-2xl font-bold text-slate-900 tabular-nums">
                            {formatRupees(milestone.trancheAmount)}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Tranche {milestone.trancheId}</div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <button
                            onClick={() => handleOpenApprovalConfirmation(milestone)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Release Funds</span>
                          </button>
                          <button
                            onClick={() => handleOpenReviewModal(milestone, 'REJECT')}
                            className="w-full bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Request Revision</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Supervised Grants Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Supervised Research Grants
              </h3>
              <p className="text-xs text-slate-500">
                Overview of all institutional projects under your committee&apos;s evaluation.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('grants')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Manage Grants
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allGrants.map((g) => (
              <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-800 font-semibold">{g.grantCode}</span>
                  <span className="text-emerald-700 font-medium">{g.status}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{g.title}</h4>
                <div className="text-xs text-slate-600">
                  Institution: <strong className="text-slate-800">{g.organization}</strong>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500">Total Budget:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatRupees(g.totalGrantAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Review Decision */}
        {reviewModalOpen && selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Official Review Decision
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Evaluating Milestone {selectedMilestone.milestoneNumber}: <strong className="text-slate-800">{selectedMilestone.title}</strong>
              </p>

              <form onSubmit={handleRecordDecision} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Decision:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecisionModalMode('APPROVE')}
                      className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        decisionModalMode === 'APPROVE'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approve & Release {formatRupees(selectedMilestone.trancheAmount)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionModalMode('REJECT')}
                      className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        decisionModalMode === 'REJECT'
                          ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Request Revision</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formal Scientific Evaluation Notes *
                  </label>
                  <textarea
                    rows={4}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition text-white ${
                      decisionModalMode === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Decision & Dispatch Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Double-Confirmation Approval Modal (Fix 1) */}
        {confirmApprovalMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-150">
              <button
                onClick={() => {
                  if (!isConfirmingApproval) setConfirmApprovalMilestone(null);
                }}
                disabled={isConfirmingApproval}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Reviewer Authorization Step</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Confirm Milestone Approval & Tranche Release
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please verify the milestone details and grant allocation before confirming authorization.
              </p>

              {/* Details Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Grant Name:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[280px]">
                    {currentGrant.title} ({currentGrant.grantCode})
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Milestone Name:</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[280px]">
                    Milestone {confirmApprovalMilestone.milestoneNumber}: {confirmApprovalMilestone.title}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Associated Tranche:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    Tranche {confirmApprovalMilestone.milestoneNumber} ({confirmApprovalMilestone.trancheId})
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-medium">Tranche Amount:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {formatRupees(confirmApprovalMilestone.trancheAmount)}
                  </span>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Warning:</strong> This action will approve Milestone {confirmApprovalMilestone.milestoneNumber} and authorize only its associated Tranche {confirmApprovalMilestone.milestoneNumber} ({formatRupees(confirmApprovalMilestone.trancheAmount)}). Downstream tranches remain locked until approval.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmApprovalMilestone(null)}
                  disabled={isConfirmingApproval}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmApproval(confirmApprovalMilestone)}
                  disabled={isConfirmingApproval}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isConfirmingApproval ? (
                    <span>Authorizing...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Approval & Release</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------------------------
  // 3. GUEST DASHBOARD (External / Unauthorized)
  // -----------------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Guest Mode (Unauthenticated / No Access)
        </h2>

        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          You are viewing GrantFund as an unverified guest. You do not hold permissions to upload research evidence or authorize fund disbursements.
        </p>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 text-left space-y-2">
          <div className="font-semibold text-slate-900">How to test the system:</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Click <strong>Applicant</strong> in the top-right navbar to view applied grants and upload evidence.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>Click <strong>Approver</strong> in the top-right navbar to evaluate submissions and release funds.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
