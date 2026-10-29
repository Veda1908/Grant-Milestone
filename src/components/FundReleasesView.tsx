import React, { useState } from 'react';
import { 
  IndianRupee, 
  CheckCircle2, 
  Lock, 
  ArrowUpRight, 
  AlertCircle, 
  Info, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  FileText,
  Building,
  Calendar
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';
import { Tranche, Milestone } from '../types/soa';

export const FundReleasesView: React.FC = () => {
  const currentGrant = simulationEngine.activeGrant;
  const tranches = simulationEngine.tranches.filter((t) => t.grantId === currentGrant?.id);
  const milestones = simulationEngine.milestones.filter((m) => m.grantId === currentGrant?.id);

  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Compute 4 summary totals in INR
  const totalFunding = currentGrant ? currentGrant.totalGrantAmount : 0;
  
  const releasedAmount = tranches
    .filter((t) => t.status === 'DISBURSED')
    .reduce((sum, t) => sum + t.amount, 0);

  const readyForReleaseAmount = tranches
    .filter((t) => t.status === 'AUTHORIZED')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingLockedAmount = tranches
    .filter((t) => t.status === 'LOCKED' || t.status === 'HELD')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleReleaseFunds = (tranche: Tranche) => {
    setReleasingId(tranche.id);
    setErrorToast(null);
    setSuccessToast(null);

    // Call simulation engine's separate release action
    const res = simulationEngine.releaseTrancheFunds(tranche.id);
    setTimeout(() => {
      setReleasingId(null);
      if (res.success) {
        setSuccessToast(`Funds released successfully! ${formatRupees(tranche.amount)} has been credited to ${tranche.recipientAccount || 'grantee account'}.`);
      } else {
        setErrorToast(res.message);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Fund Releases & Tranche Disbursements</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and authorize grant funding tranches qualified through independent milestone approvals.
          </p>
        </div>

        {/* Selected Grant Badge */}
        {currentGrant && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{currentGrant.grantCode}</span>
            <span className="text-slate-300">|</span>
            <span className="truncate max-w-[200px]">{currentGrant.title}</span>
          </div>
        )}
      </div>

      {/* Demo Mode Disclaimer Note */}
      <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Demo Mode: </span>
          All disbursements shown here represent demonstration grant workflows. 
          Under SOA governance rules, approving a milestone qualifies only its associated tranche; disbursement is an authorized separate step.
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successToast && (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)} 
            className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorToast && (
        <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button 
            onClick={() => setErrorToast(null)} 
            className="text-rose-700 hover:text-rose-900 font-semibold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Cards (Requirement 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Grant Funding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Grant Funding</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {formatRupees(totalFunding)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Allocated across {tranches.length} tranches</span>
            </div>
          </div>
        </div>

        {/* 2. Released Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Released Amount</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-700">
              {formatRupees(releasedAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{Math.round((releasedAmount / (totalFunding || 1)) * 100)}% of grant disbursed</span>
            </div>
          </div>
        </div>

        {/* 3. Ready for Release */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Ready for Release</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-700">
              {formatRupees(readyForReleaseAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>{tranches.filter(t => t.status === 'AUTHORIZED').length} tranche qualified</span>
            </div>
          </div>
        </div>

        {/* 4. Remaining Locked Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Remaining Locked Amount</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-700">
              {formatRupees(remainingLockedAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Requires milestone evidence & approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tranches Table (Requirement 9) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Grant Installments & Fund Status</h2>
            <p className="text-xs text-slate-500">
              Each installment is locked until approval of its corresponding milestone.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto">
            Domain: TrancheService (PostgreSQL Port: 5434)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Installment Amount</th>
                <th className="py-3 px-4">Recipient Account</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Release / Qualified Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tranches.map((tranche) => {
                const milestone = milestones.find((m) => m.id === tranche.milestoneId);
                const isReady = tranche.status === 'AUTHORIZED';
                const isDisbursed = tranche.status === 'DISBURSED';
                const isLocked = tranche.status === 'LOCKED' || tranche.status === 'HELD';

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Locked
                  </span>
                );

                if (isReady) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-200">
                      <Clock className="w-3 h-3 text-blue-600" />
                      Ready for Release
                    </span>
                  );
                } else if (isDisbursed) {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Released
                    </span>
                  );
                }

                // Date display
                let dateDisplay = <span className="text-slate-400">Locked until approval</span>;
                if (isDisbursed && tranche.disbursedAt) {
                  dateDisplay = (
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(tranche.disbursedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  );
                } else if (isReady && tranche.authorizedAt) {
                  dateDisplay = (
                    <div className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Qualified on {new Date(tranche.authorizedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  );
                }

                return (
                  <tr key={tranche.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {milestone ? `Milestone ${milestone.milestoneNumber}: ${milestone.title}` : `Tranche ${tranche.trancheNumber}`}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        ID: {tranche.id} {milestone ? `| Due: ${milestone.targetDate}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      {formatRupees(tranche.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {tranche.recipientAccount || 'NEFT-SBIN0001824-DST'}
                    </td>

                    <td className="py-3.5 px-4">
                      {statusBadge}
                    </td>

                    <td className="py-3.5 px-4">
                      {dateDisplay}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isReady ? (
                        <button
                          onClick={() => handleReleaseFunds(tranche)}
                          disabled={releasingId === tranche.id}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-xs transition inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>{releasingId === tranche.id ? 'Processing...' : 'Release Funds'}</span>
                        </button>
                      ) : isDisbursed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled
                        </span>
                      ) : (
                        <span 
                          className="text-slate-400 text-xs italic cursor-not-allowed" 
                          title="This tranche cannot be released until Milestone evidence is approved"
                        >
                          Milestone Pending
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

      {/* Disbursement Ledger History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Settlement Ledger & Transaction Hashes</h3>
        <p className="text-xs text-slate-500 mb-4">
          Immutable ledger records logged by TrancheService upon payment release verification.
        </p>

        {simulationEngine.disbursementLedgers.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No tranches disbursed yet. Once an approved milestone has its funds released, settlement entries will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 text-[11px]">
                  <th className="py-2">Reference ID</th>
                  <th className="py-2">Tranche ID</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Processed Instance</th>
                  <th className="py-2">Tx Hash</th>
                  <th className="py-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {simulationEngine.disbursementLedgers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-slate-800">{item.id}</td>
                    <td className="py-2.5 font-mono text-[11px]">{item.trancheId}</td>
                    <td className="py-2.5 font-semibold text-emerald-700 font-mono">{formatRupees(item.amount)}</td>
                    <td className="py-2.5 text-slate-500 text-[11px] font-mono">{item.consumedEventId.slice(0, 16)}...</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{item.transactionRef.slice(0, 16)}...</td>
                    <td className="py-2.5 text-right font-mono text-[11px] text-slate-500">
                      {new Date(item.releasedAt).toLocaleTimeString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
