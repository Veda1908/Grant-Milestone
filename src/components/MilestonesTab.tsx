import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  Upload, 
  Check, 
  X, 
  Send, 
  Calendar, 
  FileText,
  AlertCircle,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Milestone, UserProfile, EvidenceSubmission } from '../types/soa';
import { formatRupees } from '../utils/formatters';

interface MilestonesTabProps {
  currentUser: UserProfile;
}

export const MilestonesTab: React.FC<MilestonesTabProps> = ({ currentUser }) => {
  const [, setTick] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decisionModalMode, setDecisionModalMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  // Confirmation Modal State (Fix 1)
  const [confirmApprovalMilestone, setConfirmApprovalMilestone] = useState<Milestone | null>(null);
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);

  // Evidence Form
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceMetrics, setEvidenceMetrics] = useState('');

  // Review Form
  const [reviewComments, setReviewComments] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Subscribe to simulation updates
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const activeGrant = simulationEngine.activeGrant;
  const milestones = simulationEngine.activeMilestones;
  const tranches = simulationEngine.activeTranches;
  const evidenceList = simulationEngine.evidenceSubmissions;

  const [viewingEvidence, setViewingEvidence] = useState<{ milestone: Milestone; evidence: EvidenceSubmission } | null>(null);

  const handleOpenEvidence = (m: Milestone, isResubmit = false) => {
    setSelectedMilestone(m);
    const existingEv = evidenceList.find((e) => e.milestoneId === m.id);
    if (existingEv) {
      setEvidenceTitle(existingEv.title);
      setEvidenceDescription(existingEv.description);
      setEvidenceMetrics(existingEv.metricsAchieved);
    } else if (m.milestoneNumber === 1) {
      setEvidenceTitle(`Milestone 1 Deliverable Report & Spectrometry Metrics`);
      setEvidenceDescription(`Achieved 88.4% CO₂ capture during testing. The sample purity check was successful.`);
      setEvidenceMetrics(`CO₂ Capture: 88.4% (Target: 85%) | Sample Purity: 99.8%`);
    } else {
      setEvidenceTitle(`Milestone ${m.milestoneNumber} Deliverable Report & Field Data`);
      setEvidenceDescription(`Comprehensive operational verification report fulfilling all scheduled milestone deliverables.`);
      setEvidenceMetrics(`All benchmark KPIs achieved (>85% efficiency, zero downtime, validated logbook).`);
    }
    setEvidenceModalOpen(true);
  };

  const handleViewEvidence = (m: Milestone) => {
    const ev = evidenceList.find((e) => e.milestoneId === m.id);
    if (ev) {
      setViewingEvidence({ milestone: m, evidence: ev });
    } else if (m.milestoneNumber === 1) {
      setViewingEvidence({
        milestone: m,
        evidence: {
          id: `EVD-${m.id}`,
          milestoneId: m.id,
          grantId: m.grantId,
          submittedBy: `${activeGrant.granteeName} (Applicant)`,
          submittedAt: '2024-04-18T14:32:00Z',
          title: 'Phase 1 Complete Milestone Report & Spectrometry Metrics',
          description: 'Achieved 88.4% CO₂ capture during testing. The sample purity check was successful.',
          documentUrl: 'https://storage.cloud.gov/grants/GRNT-9042/evidence/m1_certified_report.pdf',
          checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          metricsAchieved: 'CO₂ Capture: 88.4% (Target: 85%) | Sample Purity: 99.8%',
          version: 1
        }
      });
    } else {
      setViewingEvidence({
        milestone: m,
        evidence: {
          id: `EVD-${m.id}`,
          milestoneId: m.id,
          grantId: m.grantId,
          submittedBy: `${activeGrant.granteeName} (Applicant)`,
          submittedAt: new Date().toISOString(),
          title: `Milestone ${m.milestoneNumber} Deliverables & Field Report`,
          description: m.description,
          documentUrl: `https://storage.cloud.gov/grants/${m.grantId}/evidence/${m.id}.pdf`,
          checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          metricsAchieved: 'All benchmark criteria validated.',
          version: 1
        }
      });
    }
  };

  const handleOpenApprovalConfirmation = (m: Milestone) => {
    setConfirmApprovalMilestone(m);
  };

  const handleConfirmApproval = (m: Milestone) => {
    if (isConfirmingApproval) return;
    setIsConfirmingApproval(true);

    const res = simulationEngine.reviewMilestone(
      m.id,
      'APPROVE',
      'Independent scientific audit verified laboratory logs and data. Approved for immediate tranche release.'
    );

    setTimeout(() => {
      setIsConfirmingApproval(false);
      setConfirmApprovalMilestone(null);
      if (res.success) {
        setAlertMessage(`Milestone approved. Tranche ${m.milestoneNumber} authorized for release.`);
      } else {
        setAlertMessage(res.message);
      }
      setTimeout(() => setAlertMessage(null), 5000);
    }, 200);
  };

  const handleOpenReview = (m: Milestone, mode: 'APPROVE' | 'REJECT') => {
    setSelectedMilestone(m);
    setDecisionModalMode(mode);
    setReviewComments(
      mode === 'APPROVE'
        ? 'Independent scientific audit verified laboratory logs and data. Approved for immediate tranche release.'
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
      setAlertMessage(res.message);
      setEvidenceModalOpen(false);
      setTimeout(() => setAlertMessage(null), 5000);
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
        setAlertMessage(`Milestone approved. Tranche ${selectedMilestone.milestoneNumber} authorized for release.`);
      } else {
        setAlertMessage('Milestone was rejected with reviewer feedback sent to applicant.');
      }
      setReviewModalOpen(false);
      setTimeout(() => setAlertMessage(null), 5000);
    } else {
      setAlertMessage(res.message);
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {alertMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-slate-500 hover:text-slate-800">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-800">
              {currentUser.role === 'grantee' && 'Applicant Deliverables Workspace'}
              {currentUser.role === 'grantReviewer' && 'Approver Evaluation & Audit Queue'}
              {currentUser.role === 'unauthorized' && 'Public Milestones Directory (Guest Mode)'}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {currentUser.role === 'grantee' && 'Milestones & Evidence Submission'}
              {currentUser.role === 'grantReviewer' && 'Pending Milestone Reviews'}
              {currentUser.role === 'unauthorized' && 'Grant Milestones Overview'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.role === 'grantee' && 'Submit deliverables, test metrics, and revised project reports for reviewer verification to unlock scheduled tranches.'}
              {currentUser.role === 'grantReviewer' && 'Evaluate submitted scientific deliverables, log independent review decisions, and authorize tranche releases.'}
              {currentUser.role === 'unauthorized' && 'Public view of milestone deliverables and target dates. Read-only access.'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Active Grant: <strong className="text-slate-800">{activeGrant.grantCode}</strong></div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">{milestones.length} Milestones Scheduled</div>
          </div>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const tranche = tranches.find((t) => t.id === milestone.trancheId);
          const isDisbursed = tranche?.status === 'DISBURSED';
          const isApproved = milestone.status === 'APPROVED';
          const isSubmitted = milestone.status === 'EVIDENCE_SUBMITTED' || milestone.status === 'UNDER_REVIEW';
          const isRejected = milestone.status === 'REJECTED';
          const isPending = milestone.status === 'PENDING_EVIDENCE';
          const evidence = evidenceList.filter((e) => e.milestoneId === milestone.id);
          const latestEvidence = evidence.length > 0 ? evidence[evidence.length - 1] : null;

          return (
            <div
              key={milestone.id}
              className={`bg-white p-4 sm:p-5 rounded-xl border shadow-xs transition ${
                isDisbursed
                  ? 'border-emerald-300 ring-1 ring-emerald-200'
                  : isSubmitted
                  ? 'border-indigo-200'
                  : isRejected
                  ? 'border-rose-200'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Milestone Number, Title, Date, Status */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">Milestone {milestone.milestoneNumber}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-slate-500">{milestone.id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target Date: {milestone.targetDate}
                    </span>
                    <span className="text-slate-300">·</span>

                    {isDisbursed ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Released
                      </span>
                    ) : isApproved ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Approver
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-indigo-700 font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Evidence Submitted (Under Review)
                      </span>
                    ) : isRejected ? (
                      <span className="text-rose-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Revisions Requested
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Pending Evidence
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{milestone.title}</h3>

                  {/* Approver Milestones View: Short Milestone Objective & brief Submitted Evidence summary */}
                  {currentUser.role === 'grantReviewer' && (
                    <div className="space-y-1 pt-1 text-xs text-slate-600">
                      {milestone.description && (
                        <p className="line-clamp-2 leading-relaxed">
                          <span className="font-semibold text-slate-700">Milestone Objective: </span>
                          <span>{milestone.description}</span>
                        </p>
                      )}
                      {latestEvidence && (
                        <p className="line-clamp-1 leading-relaxed">
                          <span className="font-semibold text-slate-700">Submitted Evidence: </span>
                          <span className="text-slate-700">
                            {latestEvidence.description || latestEvidence.title}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Tranche Amount & Role-Specific Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="sm:text-right min-w-[120px]">
                    <span className="text-[11px] text-slate-500 font-medium block">Tranche Allocation</span>
                    <div className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                      {formatRupees(milestone.trancheAmount)}
                    </div>
                  </div>

                  <div className="w-full sm:w-60 shrink-0">
                    {/* APPLICANT ACTIONS:
                        - NOT_SUBMITTED: Show "Upload Evidence"
                        - UNDER_REVIEW: Show "View Submitted Evidence" only (no editing while in progress)
                        - REVISION_REQUESTED / REJECTED: Show "Revise & Resubmit"
                        - APPROVED: Show "View Approved Evidence" only (read-only, no modification)
                    */}
                    {currentUser.role === 'grantee' && (
                      <>
                        {isDisbursed ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-emerald-800 text-xs font-medium py-2 px-3 rounded-lg border border-emerald-300 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Approved Evidence</span>
                            </button>
                            <div className="w-full py-1 bg-emerald-100 text-emerald-800 text-[11px] text-center rounded-md font-medium flex items-center justify-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>(NEFT Settled) Transfer Completed</span>
                            </div>
                          </div>
                        ) : isApproved ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-emerald-800 text-xs font-medium py-2 px-3 rounded-lg border border-emerald-300 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Approved Evidence</span>
                            </button>
                            <div className="w-full py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] text-center rounded-md font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Milestone Approved by Reviewer</span>
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleOpenEvidence(milestone, true)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Revise & Resubmit</span>
                            </button>
                            <div className="text-[11px] text-rose-700 text-center font-medium bg-rose-50 py-1 rounded border border-rose-200">
                              Revisions Requested
                            </div>
                          </div>
                        ) : isSubmitted ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Submitted Evidence</span>
                            </button>
                            <div className="text-[11px] text-indigo-700 text-center font-medium bg-indigo-50 py-1 rounded border border-indigo-100">
                              Under Review by Approver
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenEvidence(milestone)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Evidence</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* APPROVER ACTIONS: Evaluate submitted deliverables, Approve or Request Revision */}
                    {currentUser.role === 'grantReviewer' && (
                      <>
                        {isDisbursed ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Approved Evidence</span>
                            </button>
                            <div className="w-full py-1.5 bg-emerald-100 text-emerald-800 text-xs text-center rounded-lg font-medium flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Authorized & Disbursed</span>
                            </div>
                          </div>
                        ) : isApproved ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Approved Evidence</span>
                            </button>
                            <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs text-center rounded-lg font-medium flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved (Ready for Release)</span>
                            </div>
                          </div>
                        ) : isSubmitted ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewEvidence(milestone)}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Review Evidence</span>
                            </button>
                            <button
                              onClick={() => handleOpenApprovalConfirmation(milestone)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve & Release Funds</span>
                            </button>
                            <button
                              onClick={() => handleOpenReview(milestone, 'REJECT')}
                              className="w-full bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Request Revision</span>
                            </button>
                          </div>
                        ) : isRejected ? (
                          <div className="text-xs text-rose-700 text-center py-1.5 bg-rose-50 rounded-lg border border-rose-200 font-medium">
                            Revisions Requested from Applicant
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 text-center py-2 bg-slate-100 rounded-lg">
                            Awaiting Applicant Submission
                          </div>
                        )}
                      </>
                    )}

                    {/* GUEST ACTIONS: Read-only, no actions */}
                    {currentUser.role === 'unauthorized' && (
                      <div className="space-y-1.5">
                        {evidence.length > 0 && (
                          <button
                            onClick={() => handleViewEvidence(milestone)}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Public Evidence</span>
                          </button>
                        )}
                        <div className="text-xs text-slate-400 text-center py-2 bg-slate-100 rounded-lg">
                          Guest View · Read-Only
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Evidence */}
      {evidenceModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-150">
            <button onClick={() => setEvidenceModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {selectedMilestone.status === 'REJECTED' ? 'Revise & Resubmit Milestone' : 'Upload Milestone'} {selectedMilestone.milestoneNumber} Evidence
            </h3>
            <p className="text-xs text-slate-500 mb-4">{selectedMilestone.title}</p>
            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Submitted Project Report Title *</label>
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Results & Summary *</label>
                <textarea
                  rows={3}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Metrics Achieved *</label>
                <input
                  type="text"
                  value={evidenceMetrics}
                  onChange={(e) => setEvidenceMetrics(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEvidenceModalOpen(false)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm">
                  {selectedMilestone.status === 'REJECTED' ? 'Resubmit for Review' : 'Submit to Approver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review */}
      {reviewModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative">
            <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Official Review Decision</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedMilestone.title}</p>
            <form onSubmit={handleRecordDecision} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecisionModalMode('APPROVE')}
                  className={`p-3 rounded-lg border text-xs font-semibold ${decisionModalMode === 'APPROVE' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 text-slate-600'}`}
                >
                  Approve ({formatRupees(selectedMilestone.trancheAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionModalMode('REJECT')}
                  className={`p-3 rounded-lg border text-xs font-semibold ${decisionModalMode === 'REJECT' ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-slate-50 text-slate-600'}`}
                >
                  Reject
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Notes *</label>
                <textarea
                  rows={4}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReviewModalOpen(false)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm">Submit Decision</button>
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
                  {activeGrant.title} ({activeGrant.grantCode})
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

      {/* Modal: Read-Only Evidence View / Review */}
      {viewingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl relative animate-in fade-in duration-150">
            <button
              onClick={() => setViewingEvidence(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-1">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Milestone Evidence Details</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Milestone {viewingEvidence.milestone.milestoneNumber}: {viewingEvidence.milestone.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Target Date: {viewingEvidence.milestone.targetDate}</span>
              <span>·</span>
              <span>Tranche: <strong className="text-slate-800">{formatRupees(viewingEvidence.milestone.trancheAmount)}</strong></span>
              <span>·</span>
              <span>Status: <strong className="text-slate-800">{viewingEvidence.milestone.status}</strong></span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-4 space-y-3.5 text-xs">
              {/* Milestone Objective */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Milestone Objective
                </span>
                <p className="text-slate-800 leading-relaxed mt-1">
                  {viewingEvidence.milestone.description}
                </p>
              </div>

              {/* Required Deliverables */}
              <div className="pt-2.5 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Required Deliverables
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 text-slate-700">
                  {viewingEvidence.milestone.deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submitted Project Report */}
              <div className="pt-2.5 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Submitted Project Report Title
                </span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
                  {viewingEvidence.evidence.title}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mt-2">
                  Submitted Evidence & Summary
                </span>
                <p className="text-slate-800 leading-relaxed mt-0.5">
                  {viewingEvidence.evidence.description}
                </p>
              </div>

              {/* Key Metrics Achieved (KPIs) */}
              <div className="pt-2.5 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Key Metrics & Results (KPIs)
                </span>
                <p className="text-emerald-700 font-medium font-mono text-xs mt-1 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                  {viewingEvidence.evidence.metricsAchieved}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 text-[11px] text-slate-500">
                <span>Submitted By: <strong className="text-slate-700">{viewingEvidence.evidence.submittedBy}</strong></span>
                <span>SHA-256: <strong className="text-slate-700 font-mono text-[10px]">{viewingEvidence.evidence.checksumSha256.slice(0, 16)}...</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-end mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingEvidence(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
