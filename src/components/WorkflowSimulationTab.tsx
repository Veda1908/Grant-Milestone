import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Lock, 
  Unlock, 
  AlertCircle, 
  Upload, 
  ShieldAlert, 
  Zap, 
  Check, 
  X, 
  Send, 
  Info, 
  ChevronRight, 
  Building2, 
  Calendar,
  PlusCircle,
  FolderOpen,
  IndianRupee,
  Layers
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { Milestone, Tranche, UserProfile, Grant } from '../types/soa';
import { fireReleaseConfetti } from '../utils/confetti';
import { formatRupees } from '../utils/formatters';

interface WorkflowSimulationTabProps {
  currentUser: UserProfile;
  onNavigateToKafka: () => void;
  onNavigateToTests: () => void;
}

export const WorkflowSimulationTab: React.FC<WorkflowSimulationTabProps> = ({
  currentUser,
  onNavigateToKafka,
  onNavigateToTests
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [createGrantModalOpen, setCreateGrantModalOpen] = useState(false);
  const [decisionModalMode, setDecisionModalMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  
  // Create Grant Form State
  const [newGrantTitle, setNewGrantTitle] = useState('');
  const [newGrantOrg, setNewGrantOrg] = useState('');
  const [newGrantApplicant, setNewGrantApplicant] = useState('');
  const [newM1Title, setNewM1Title] = useState('Laboratory Prototype Validation & Sequencing');
  const [newM1Amount, setNewM1Amount] = useState('600000');
  const [newM2Title, setNewM2Title] = useState('Pilot Field Trial & 30-Day Testing');
  const [newM2Amount, setNewM2Amount] = useState('800000');
  const [newM3Title, setNewM3Title] = useState('Commercial Scale Deployment & Clearance');
  const [newM3Amount, setNewM3Amount] = useState('1000000');

  // Evidence Form State
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceMetrics, setEvidenceMetrics] = useState('');

  // Review Form State
  const [reviewComments, setReviewComments] = useState('');
  
  // UI Notifications
  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const grants = simulationEngine.grants;
  const currentGrant = simulationEngine.activeGrant;
  const milestones = simulationEngine.activeMilestones;
  const tranches = simulationEngine.activeTranches;
  const evidenceList = simulationEngine.evidenceSubmissions;

  const showAlert = (text: string, type: 'success' | 'error' | 'info') => {
    setAlertMessage({ text, type });
    setTimeout(() => {
      setAlertMessage(null);
    }, 7000);
  };

  const handleGrantChange = (grantId: string) => {
    simulationEngine.selectGrant(grantId);
  };

  const handleOpenEvidenceModal = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setEvidenceTitle(`Milestone ${milestone.milestoneNumber} Deliverable Report & Field Data`);
    setEvidenceDescription(`Comprehensive operational verification report fulfilling all scheduled milestone deliverables.`);
    setEvidenceMetrics(`All benchmark KPIs achieved (>85% efficiency, zero downtime, validated logbook).`);
    setEvidenceModalOpen(true);
  };

  const handleDirectApprove = (milestone: Milestone) => {
    const res = simulationEngine.reviewMilestone(
      milestone.id,
      'APPROVE',
      'Official scientific evaluation verified all submitted lab metrics, DNA sequencing, and test data against grant requirements. Approved for immediate tranche fund release.'
    );

    if (res.success) {
      fireReleaseConfetti();
      showAlert(
        `Milestone ${milestone.milestoneNumber} approved! Tranche ${milestone.trancheId} (${formatRupees(milestone.trancheAmount)}) is now ready for release.`,
        'success'
      );
    } else {
      showAlert(res.message, 'error');
    }
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

  const handleCreateGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrantTitle.trim()) return;

    const res = simulationEngine.createGrant(
      newGrantTitle,
      newGrantOrg || 'National Research Center',
      newGrantApplicant || currentUser.name,
      [
        {
          title: newM1Title,
          description: 'Phase 1 laboratory testing and technical benchmark validation.',
          trancheAmount: parseInt(newM1Amount, 10) || 500000
        },
        {
          title: newM2Title,
          description: 'Phase 2 pilot scale implementation and operational testing.',
          trancheAmount: parseInt(newM2Amount, 10) || 750000
        },
        {
          title: newM3Title,
          description: 'Phase 3 final integration, quality audit, and commercial readiness.',
          trancheAmount: parseInt(newM3Amount, 10) || 1000000
        }
      ]
    );

    if (res.success && res.grant) {
      showAlert(`Grant "${res.grant.title}" created successfully with 3 milestones and tranches in Indian Rupees (INR)!`, 'success');
      setCreateGrantModalOpen(false);
      // Reset form
      setNewGrantTitle('');
    }
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
        fireReleaseConfetti();
        showAlert(
          `Milestone approved! Event MilestoneApproved published to Kafka (soa.s08.t03.events). Tranche ${selectedMilestone.trancheId} (${formatRupees(selectedMilestone.trancheAmount)}) disbursed.`,
          'success'
        );
      } else {
        showAlert(res.message, 'info');
      }
      setReviewModalOpen(false);
    } else {
      showAlert(res.message, 'error');
    }
  };

  const handleQuickApproveMilestone1 = () => {
    const m1 = milestones.find((m) => m.milestoneNumber === 1);
    if (!m1) return;

    if (currentUser.role !== 'grantReviewer') {
      const res = simulationEngine.reviewMilestone(
        m1.id,
        'APPROVE',
        'Official Review: Verified laboratory logs and compliance. Approved for tranche fund disbursement.'
      );

      if (!res.success) {
        showAlert(
          `Security Notice (403 Forbidden): You are acting as '${currentUser.role}'. In the top-right navbar, click 'Approver' to authorize tranche fund release.`,
          'error'
        );
        return;
      }
    }

    const res = simulationEngine.reviewMilestone(
      m1.id,
      'APPROVE',
      'Official Review: Verified laboratory logs and compliance. Approved for tranche fund disbursement.'
    );

    if (res.success) {
      fireReleaseConfetti();
      showAlert(
        `SUCCESS: Milestone 1 Approved! MilestoneApproved published to Kafka. Tranche 1 released (${formatRupees(m1.trancheAmount)}). Tranches 2 and 3 remain LOCKED.`,
        'success'
      );
    } else {
      showAlert(res.message, 'error');
    }
  };

  const disbursedPct = currentGrant && currentGrant.totalGrantAmount > 0 
    ? Math.round((currentGrant.disbursedAmount / currentGrant.totalGrantAmount) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : alertMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : alertMessage.type === 'error' ? (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm font-medium flex-1">{alertMessage.text}</div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grant Selector & Creation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Select Grant:</span>
          <select
            value={currentGrant?.id}
            onChange={(e) => handleGrantChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {grants.map((g) => (
              <option key={g.id} value={g.id}>
                {g.grantCode} - {g.title.substring(0, 45)}... ({formatRupees(g.totalGrantAmount)})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCreateGrantModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Grant</span>
        </button>
      </div>

      {/* Grant Summary Card */}
      {currentGrant && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-emerald-800 font-semibold">{currentGrant.grantCode}</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">Status: {currentGrant.status}</span>
                <span>·</span>
                <span>{currentGrant.startDate} to {currentGrant.endDate}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentGrant.title}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {currentGrant.organization}
                </span>
                <span>·</span>
                <span>Principal Researcher: <strong className="text-slate-800">{currentGrant.granteeName}</strong></span>
              </div>
            </div>

            {/* Quick Demo CTA */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <button
                onClick={handleQuickApproveMilestone1}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-xs"
              >
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>1-Click Demo: Approve Milestone 1 & Release Fund</span>
              </button>
              <p className="text-[11px] text-slate-500 text-left sm:text-right">
                Runs full SOA pipeline: Reviewer approval ➔ Kafka event ➔ Tranche release in ₹.
              </p>
            </div>
          </div>

          {/* Rupee Financial Metrics Strip */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">Total Grant Allocation</span>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatRupees(currentGrant.totalGrantAmount)} <span className="text-xs font-normal text-slate-500">INR</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed to Date
                </span>
                <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {formatRupees(currentGrant.disbursedAmount)} <span className="text-xs font-normal text-slate-500">({disbursedPct}%)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked Until Approval
                </span>
                <div className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                  {formatRupees(currentGrant.totalGrantAmount - currentGrant.disbursedAmount)} <span className="text-xs font-normal text-slate-500">INR</span>
                </div>
              </div>
            </div>

            {/* Clean Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-500"
                style={{ width: `${disbursedPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Guidance Banner */}
      <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-slate-600 shrink-0" />
          <div className="text-slate-700">
            <strong>How this works:</strong> As an <strong>Applicant</strong>, you upload milestone evidence. Then switch to <strong>Approver</strong> to approve the deliverable, which triggers Kafka to release funds into the grantee&apos;s bank account.
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateToKafka}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 transition"
          >
            <span>View Kafka Topic</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Milestones & Associated Tranches */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Grant Milestones & Associated Tranches
            </h2>
            <p className="text-xs text-slate-500">
              Domain Rule: Approving Milestone 1 releases <strong className="text-slate-800">only Tranche 1</strong>; other tranches remain locked until approval.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {milestones.map((milestone) => {
            const tranche = tranches.find((t) => t.id === milestone.trancheId);
            const isApproved = milestone.status === 'APPROVED';
            const isSubmitted = milestone.status === 'EVIDENCE_SUBMITTED';
            const isDisbursed = tranche?.status === 'DISBURSED';
            const evidence = evidenceList.filter((e) => e.milestoneId === milestone.id);

            return (
              <div
                key={milestone.id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition ${
                  isDisbursed
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : isSubmitted
                    ? 'border-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                  {/* Left Column: Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-700">
                        Milestone {milestone.milestoneNumber}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">{milestone.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Target: {milestone.targetDate}
                      </span>
                      <span className="text-slate-300">·</span>
                      
                      {isApproved ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-indigo-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Evidence Submitted (Under Review)
                        </span>
                      ) : milestone.status === 'REJECTED' ? (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Revisions Requested
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Pending Evidence
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {milestone.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Deliverables */}
                    <div className="pt-1">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1">
                        Required Deliverables:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                        {milestone.deliverables.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence Snippet */}
                    {evidence.length > 0 && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-700 font-medium">
                          <span className="flex items-center gap-1.5 text-indigo-700">
                            <FileText className="w-3.5 h-3.5" />
                            Submitted: {evidence[0].title}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            SHA: {evidence[0].checksumSha256.substring(0, 14)}...
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{evidence[0].description}</p>
                        <div className="text-emerald-700 font-medium text-[11px] mt-1">
                          KPI Metrics: {evidence[0].metricsAchieved}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Tranche & Actions */}
                  <div className="lg:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between shrink-0">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Tranche ID:</span>
                        <span className="font-mono font-medium text-slate-700">{milestone.trancheId}</span>
                      </div>

                      <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        {formatRupees(milestone.trancheAmount)}
                        <span className="text-xs font-normal text-slate-500 ml-1">INR</span>
                      </div>

                      <div className="mt-2 text-xs flex items-center justify-between text-slate-600 border-t border-slate-200/60 pt-2">
                        <span>Fund State:</span>
                        <span className={`font-semibold ${isDisbursed ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tranche?.status}
                        </span>
                      </div>

                      {isDisbursed && tranche?.transactionHash && (
                        <div className="mt-1 text-[10px] text-slate-500 font-mono">
                          Ref: {tranche.transactionHash.substring(0, 16)}...
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      {isDisbursed ? (
                        <div className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Tranche Released to Bank
                        </div>
                      ) : isApproved ? (
                        <div className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs text-center font-medium">
                          Milestone Approved
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEvidenceModal(milestone)}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium py-2 px-3 rounded-lg border border-slate-200 shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{milestone.status === 'EVIDENCE_SUBMITTED' ? 'Update Evidence' : 'Submit Evidence'}</span>
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleDirectApprove(milestone)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-2 px-2 rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenReviewModal(milestone, 'REJECT')}
                              className="bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium py-2 px-2 rounded-lg border border-slate-200 transition flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Downstream Disbursement Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Downstream Disbursement Ledger (Tranche Service Store)
            </h3>
            <p className="text-xs text-slate-500">
              Electronic bank transactions created autonomously after consuming <code className="text-slate-800">MilestoneApproved</code> from Kafka.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {simulationEngine.disbursementLedgers.length} Records Settled
          </span>
        </div>

        {simulationEngine.disbursementLedgers.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 text-xs">
            No tranches released yet. Click &ldquo;1-Click Demo&rdquo; above to approve Milestone 1 and observe automated Kafka fund release.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Ledger ID</th>
                  <th className="py-2.5 px-3">Tranche</th>
                  <th className="py-2.5 px-3">Amount (INR)</th>
                  <th className="py-2.5 px-3">Transaction Ref</th>
                  <th className="py-2.5 px-3">Consumed Kafka Event ID</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {simulationEngine.disbursementLedgers.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{l.id}</td>
                    <td className="py-2.5 px-3 text-emerald-700">{l.trancheId}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">
                      {formatRupees(l.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{l.transactionRef}</td>
                    <td className="py-2.5 px-3 text-amber-700">{l.consumedEventId.substring(0, 16)}...</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create New Grant */}
      {createGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateGrantModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-xs font-mono text-emerald-600 mb-1">
              POST /api/v1/grants (Grant Service)
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Create a New Grant Scheme
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Define grant details and milestones with allocated tranche funds in Indian Rupees (₹).
            </p>

            <form onSubmit={handleCreateGrantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grant Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIIMS Clean Water Purification Nanotech Project"
                  value={newGrantTitle}
                  onChange={(e) => setNewGrantTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Host Institution / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AIIMS New Delhi / IIT Bombay"
                    value={newGrantOrg}
                    onChange={(e) => setNewGrantOrg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal Applicant Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Priya Sharma"
                    value={newGrantApplicant}
                    onChange={(e) => setNewGrantApplicant(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Milestones Configuration in Rupees */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Define 3 Sequential Milestones & Tranches (INR ₹):
                </span>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-emerald-800 block">Milestone 1</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <input
                        type="text"
                        value={newM1Title}
                        onChange={(e) => setNewM1Title(e.target.value)}
                        placeholder="Milestone 1 Title"
                        className="sm:col-span-2 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          value={newM1Amount}
                          onChange={(e) => setNewM1Amount(e.target.value)}
                          placeholder="Amount in INR"
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-emerald-800 block">Milestone 2</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <input
                        type="text"
                        value={newM2Title}
                        onChange={(e) => setNewM2Title(e.target.value)}
                        placeholder="Milestone 2 Title"
                        className="sm:col-span-2 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          value={newM2Amount}
                          onChange={(e) => setNewM2Amount(e.target.value)}
                          placeholder="Amount in INR"
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-emerald-800 block">Milestone 3</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      <input
                        type="text"
                        value={newM3Title}
                        onChange={(e) => setNewM3Title(e.target.value)}
                        placeholder="Milestone 3 Title"
                        className="sm:col-span-2 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          value={newM3Amount}
                          onChange={(e) => setNewM3Amount(e.target.value)}
                          placeholder="Amount in INR"
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateGrantModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Grant & Initialize Tranches</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <div className="text-xs font-mono text-emerald-600 mb-1">
              POST /api/v1/milestones/{selectedMilestone.id}/evidence
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Submit Milestone {selectedMilestone.milestoneNumber} Evidence
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Active User: <strong className="text-slate-800">{currentUser.name} ({currentUser.role})</strong>
            </p>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submitted Project Report Title
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
                  Operational Summary & Results
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
                  Quantifiable Metrics (KPIs Achieved)
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit to MilestoneReview Service</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <div className="text-xs font-mono text-emerald-600 mb-1">
              POST /api/v1/reviews/decisions
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Record Independent Review Decision
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Milestone {selectedMilestone.milestoneNumber}: <strong className="text-slate-800">{selectedMilestone.title}</strong>
            </p>

            <form onSubmit={handleRecordDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Reviewer Decision:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionModalMode('APPROVE')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionModalMode === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Tranche Release</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionModalMode('REJECT')}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionModalMode === 'REJECT'
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
                  Official Verification Sign-Off & Notes
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
                  <span>Submit Review Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
