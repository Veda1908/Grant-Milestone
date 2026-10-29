import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ExternalLink,
  ChevronDown,
  Building,
  Calendar,
  Lock,
  IndianRupee,
  CheckCircle,
  X
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';
import { Milestone, EvidenceSubmission } from '../types/soa';

export const PendingReviewsView: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [comments, setComments] = useState('');
  const [inspectDoc, setInspectDoc] = useState<EvidenceSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentUser = simulationEngine.currentUser;
  const isApprover = currentUser.role === 'grantReviewer';

  // Milestones needing review
  const pendingMilestones = simulationEngine.milestones.filter(
    (m) => m.status === 'EVIDENCE_SUBMITTED'
  );

  const allMilestones = simulationEngine.milestones;
  const decisions = simulationEngine.reviewerDecisions;

  const handleDirectApprove = (m: Milestone) => {
    if (!isApprover) {
      setFeedback({
        type: 'error',
        message: 'Access Denied: Your current role is not authorized to record review decisions. Switch to Approver (Reviewer).'
      });
      return;
    }

    const res = simulationEngine.reviewMilestone(
      m.id,
      'APPROVE',
      'All technical deliverables and verification logs verified against DST milestone protocol specifications.'
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Milestone ${m.milestoneNumber} approved! Tranche installment of ${formatRupees(m.trancheAmount)} is now ready for release.`
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.message
      });
    }
  };

  const handleOpenReview = (m: Milestone, type: 'APPROVE' | 'REJECT') => {
    setSelectedMilestone(m);
    setDecisionType(type);
    setComments(
      type === 'APPROVE'
        ? 'All technical deliverables and verification logs verified against DST milestone protocol specifications.'
        : 'Deliverable logbook lacks empirical test metrics from the live pilot bench. Please re-upload with bench telemetry.'
    );
    setFeedback(null);
  };

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    if (!isApprover) {
      setFeedback({
        type: 'error',
        message: 'Access Denied: Your current role is not authorized to record review decisions. Switch to Approver (Reviewer).'
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = simulationEngine.reviewMilestone(selectedMilestone.id, decisionType, comments);
      setIsSubmitting(false);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message
        });
        setSelectedMilestone(null);
      } else {
        setFeedback({
          type: 'error',
          message: res.message
        });
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pending Milestone Reviews</span>
            {pendingMilestones.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {pendingMilestones.length} Awaiting Sign-off
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Independent reviewer verification queue for grant milestone evidence and tranche authorization.
          </p>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-md border font-semibold ${
            isApprover 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            Role: {currentUser.role}
          </span>
          {!isApprover && (
            <span className="text-rose-600 text-[11px] font-medium">
              (Read-Only: Switch to Approver to sign off)
            </span>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedback && (
        <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="text-slate-500 hover:text-slate-800 font-semibold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Review Queue Cards */}
      {pendingMilestones.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">All Milestone Reviews Completed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are no pending submissions awaiting reviewer sign-off at this time. When applicants upload deliverable evidence, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingMilestones.map((m) => {
            const grant = simulationEngine.grants.find((g) => g.id === m.grantId);
            const evidenceDocs = simulationEngine.evidenceSubmissions.filter((e) => e.milestoneId === m.id);

            return (
              <div 
                key={m.id}
                className="bg-white rounded-xl border border-amber-200/80 shadow-xs p-5 transition hover:border-amber-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {grant?.grantCode || m.grantId}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Milestone {m.milestoneNumber}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {m.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1">
                      {m.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {grant?.organization || 'Research Institution'} ({grant?.granteeName})
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1.5 font-mono text-emerald-700 font-semibold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {formatRupees(m.trancheAmount)} tranche on approval
                      </span>
                    </div>
                  </div>

                  {/* Actions for Approvers */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      onClick={() => handleOpenReview(m, 'REJECT')}
                      disabled={!isApprover}
                      className="px-3.5 py-2 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-medium text-xs transition disabled:opacity-50"
                    >
                      Request Revisions
                    </button>
                    <button
                      onClick={() => handleDirectApprove(m)}
                      disabled={!isApprover}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve Milestone</span>
                    </button>
                  </div>
                </div>

                {/* Evidence Documents Section */}
                <div className="pt-4">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Submitted Evidence Deliverables ({evidenceDocs.length} files)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {evidenceDocs.map((doc) => (
                      <div 
                        key={doc.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between hover:bg-slate-100/70 transition"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              By {doc.submittedBy}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setInspectDoc(doc)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800"
                          title="Inspect document verification hash"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Record Review Decision</span>
              </h2>
              <button 
                onClick={() => setSelectedMilestone(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4 mt-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-mono">
                  {selectedMilestone.id} · Milestone {selectedMilestone.milestoneNumber}
                </div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedMilestone.title}
                </div>
                <div className="text-emerald-700 font-semibold font-mono text-xs mt-1">
                  Tranche Release: {formatRupees(selectedMilestone.trancheAmount)}
                </div>
              </div>

              {/* Decision Toggle */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Decision Outcome *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('APPROVE')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionType === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Milestone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType('REJECT')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      decisionType === 'REJECT'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              {/* Reviewer Comments */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reviewer Justification & Comments *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Enter detailed reviewer feedback for the audit record..."
                />
              </div>

              {/* Technical Notice */}
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cross-Service Workflow Execution:</span>
                </div>
                <p>
                  Approving will sign with your JWT, publish a <code className="font-mono text-indigo-700">MilestoneApproved</code> event to Kafka topic <code className="font-mono text-amber-700">soa.s08.t03.events</code>, and transition Tranche status in PostgreSQL to <code className="font-mono text-blue-700">AUTHORIZED</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg font-semibold text-white shadow-xs transition ${
                    decisionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'Recording Decision...' : decisionType === 'APPROVE' ? 'Confirm Approval' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Evidence Verification Record</span>
              </h3>
              <button 
                onClick={() => setInspectDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Project Report Title</span>
                <span className="font-semibold text-slate-800">{inspectDoc.title}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Uploaded By</span>
                  <span>{inspectDoc.submittedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Version</span>
                  <span>v{inspectDoc.version} (Submitted)</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Reported KPIs</span>
                <span className="text-emerald-700 font-medium block">
                  {inspectDoc.metricsAchieved}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">SHA-256 Checksum</span>
                <span className="font-mono text-[10px] bg-slate-100 p-1.5 rounded block break-all text-slate-700">
                  {inspectDoc.checksumSha256}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Storage URI</span>
                <span className="font-mono text-[10px] text-indigo-600 break-all">
                  {inspectDoc.documentUrl}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
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
