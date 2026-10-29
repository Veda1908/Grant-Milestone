import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Building2, 
  ArrowUpRight, 
  FileText,
  AlertCircle,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';
import { Tranche, Milestone, UserProfile } from '../types/soa';

interface ReleasesTabProps {
  currentUser?: UserProfile;
}

export const ReleasesTab: React.FC<ReleasesTabProps> = ({ currentUser = simulationEngine.currentUser }) => {
  const [, setTick] = useState(0);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isApplicant = currentUser.role === 'grantee';
  const isApprover = currentUser.role === 'grantReviewer';
  const isGuest = currentUser.role === 'unauthorized';

  // Subscribe to simulation updates for real-time synchronization
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const currentGrant = simulationEngine.activeGrant;
  const tranches = simulationEngine.activeTranches;
  const milestones = simulationEngine.activeMilestones;
  const ledgers = simulationEngine.disbursementLedgers;

  const totalFunding = currentGrant ? currentGrant.totalGrantAmount : 0;

  const authorizedAmount = tranches
    .filter((t) => t.status === 'AUTHORIZED')
    .reduce((sum, t) => sum + t.amount, 0);

  const disbursedAmount = tranches
    .filter((t) => t.status === 'DISBURSED')
    .reduce((sum, t) => sum + t.amount, 0);

  const lockedAmount = tranches
    .filter((t) => t.status === 'LOCKED' || t.status === 'HELD')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDisburseTranche = (tranche: Tranche) => {
    if (!isApprover) return;
    setReleasingId(tranche.id);
    const res = simulationEngine.releaseTrancheFunds(tranche.id);
    setTimeout(() => {
      setReleasingId(null);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: `Funds disbursed: ${formatRupees(tranche.amount)} successfully credited to ${tranche.recipientAccount}.`
        });
      } else {
        setToastMessage({
          type: 'error',
          text: res.message
        });
      }
      setTimeout(() => setToastMessage(null), 6000);
    }, 300);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm border ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-800">
              {isApplicant && 'Applicant Fund History (Read-Only)'}
              {isApprover && 'Fund Approval & Monitoring'}
              {isGuest && 'Public Directory (Guest Mode)'}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {isApplicant && 'My Grant Installments & Fund Status'}
              {isApprover && 'Fund Releases & Installment Approvals'}
              {isGuest && 'Grant Installments & Fund Releases'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isApplicant && 'Track your awarded tranche amounts, approval qualifications, and fund transfer history. Read-only view.'}
              {isApprover && 'Review tranche installment approvals, associated milestone review history, and execute fund releases.'}
              {isGuest && 'Public view of grant tranches and release records. Read-only access.'}
            </p>
          </div>

          {currentGrant && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium justify-end">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentGrant.grantCode}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 max-w-[260px] truncate">
                {currentGrant.title}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Grant Funding</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatRupees(totalFunding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Allocated across {tranches.length} scheduled tranches
          </div>
        </div>

        {/* Authorized for Release */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Authorized for Release</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700 tabular-nums">
            {formatRupees(authorizedAmount)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            {tranches.filter(t => t.status === 'AUTHORIZED').length} milestone(s) approved & ready
          </div>
        </div>

        {/* Disbursed Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Funds Disbursed</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatRupees(disbursedAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Completed fund transfers
          </div>
        </div>

        {/* Remaining Locked */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Locked Until Approval</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-700 tabular-nums">
            {formatRupees(lockedAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requires milestone approval
          </div>
        </div>
      </div>

      {/* Main Tranches & Milestones Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Milestone Tranche Allocation & Release Status
            </h2>
            <p className="text-xs text-slate-500">
              Each installment is locked until approval of its corresponding project milestone.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
            {tranches.length} Tranches Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Tranche ID</th>
                <th className="py-3 px-4">Associated Milestone</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Milestone Review</th>
                <th className="py-3 px-4">Tranche Release Status</th>
                <th className="py-3 px-4">Recipient Account</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tranches.map((tranche) => {
                const milestone = milestones.find((m) => m.id === tranche.milestoneId);
                const isUnderReview = milestone?.status === 'EVIDENCE_SUBMITTED';
                const isApproved = milestone?.status === 'APPROVED';
                const isRejected = milestone?.status === 'REJECTED';
                const isAuthorized = tranche.status === 'AUTHORIZED';
                const isDisbursed = tranche.status === 'DISBURSED';

                return (
                  <tr key={tranche.id} className="hover:bg-slate-50/60 transition">
                    {/* Tranche ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      <div>{tranche.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">Tranche {tranche.trancheNumber}</div>
                    </td>

                    {/* Milestone */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 max-w-xs">
                        {milestone ? `Milestone ${milestone.milestoneNumber}: ${milestone.title}` : tranche.milestoneId}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {milestone?.description}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {formatRupees(tranche.amount)}
                    </td>

                    {/* Milestone Review Status */}
                    <td className="py-3.5 px-4">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Approved
                        </span>
                      ) : isUnderReview ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Under Review
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-medium">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Revisions Needed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Pending Submission
                        </span>
                      )}
                    </td>

                    {/* Tranche Release Status */}
                    <td className="py-3.5 px-4">
                      {isDisbursed ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Disbursed to Bank
                          </span>
                          {tranche.disbursedAt && (
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              {new Date(tranche.disbursedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      ) : isAuthorized ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                            Authorized for Release
                          </span>
                          {tranche.authorizedAt && (
                            <div className="text-[10px] text-blue-600 font-mono mt-1">
                              Qualified on {new Date(tranche.authorizedAt).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      ) : isUnderReview ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50/70 text-amber-800 border border-amber-200/80 text-[11px] font-medium">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Approval (Locked)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          Locked Until Approval
                        </span>
                      )}
                    </td>

                    {/* Recipient Account */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {tranche.recipientAccount || 'NEFT-SBIN0001824'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      {isApplicant ? (
                        /* Applicant is strictly read-only */
                        isDisbursed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>(NEFT Settled) Transfer Completed</span>
                          </span>
                        ) : isAuthorized ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Authorized (Ready)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 font-medium text-[11px]">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Locked Until Approval</span>
                          </span>
                        )
                      ) : isApprover ? (
                        /* Approver can execute authorized disbursements */
                        isAuthorized ? (
                          <button
                            onClick={() => handleDisburseTranche(tranche)}
                            disabled={releasingId === tranche.id}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>{releasingId === tranche.id ? 'Disbursing...' : 'Disburse Funds'}</span>
                          </button>
                        ) : isDisbursed ? (
                          <span className="text-emerald-700 font-medium text-[11px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>(NEFT Settled) Transfer Completed</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Milestone Pending
                          </span>
                        )
                      ) : (
                        /* Guest is read-only */
                        <span className="text-slate-400 text-xs italic">
                          {isDisbursed ? 'Transfer Completed' : isAuthorized ? 'Authorized' : 'Locked'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settled Transaction History */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isApplicant ? 'Fund Transfer History' : 'Transaction History'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isApplicant 
                ? 'Payment transfer records for approved grant installments.'
                : 'Transaction history logged by TrancheService upon payment release.'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {ledgers.length} Settled
          </span>
        </div>

        {ledgers.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 text-xs">
            <Receipt className="w-7 h-7 text-slate-400 mx-auto mb-1.5 opacity-70" />
            <div className="font-semibold text-slate-700">No disbursements settled yet</div>
            <p className="mt-0.5 text-slate-500">
              When an approved milestone installment is released, transaction records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-[11px]">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-sans">
                <tr>
                  <th className="py-2.5 px-3">Transaction Reference</th>
                  <th className="py-2.5 px-3">Tranche</th>
                  <th className="py-2.5 px-3">Grant ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Settlement Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgers.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{l.transactionRef}</td>
                    <td className="py-2.5 px-3 text-emerald-700">{l.trancheId}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.grantId}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">
                      {formatRupees(l.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans">
                      {new Date(l.releasedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">
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

      {/* Demo Mode Notice */}
      <div className="text-center text-xs text-slate-400 py-3 border-t border-slate-200/80 mt-6">
        <span>Demo Mode: Payment and transaction records shown are demonstration data for system simulation.</span>
      </div>
    </div>
  );
};
