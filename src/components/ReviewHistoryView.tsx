import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  FileText, 
  Search,
  Building,
  User,
  Hash
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';

export const ReviewHistoryView: React.FC = () => {
  const decisions = simulationEngine.reviewerDecisions;
  const milestones = simulationEngine.milestones;
  const grants = simulationEngine.grants;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Review & Decision History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically signed review outcomes, evaluator justifications, and audit trails.
        </p>
      </div>

      {/* Decision Records */}
      {decisions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Review Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Recorded decisions from pending milestone reviews will appear here with cryptographic signatures.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Decision ID</th>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Comments</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Digital Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {decisions.map((dec) => {
                  const milestone = milestones.find((m) => m.id === dec.milestoneId);
                  const isApproved = dec.decision === 'APPROVE';

                  return (
                    <tr key={dec.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-900">
                        {dec.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {milestone ? `M${milestone.milestoneNumber}: ${milestone.title}` : dec.milestoneId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {dec.grantId}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dec.reviewerName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px]">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Changes Requested
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-600 text-xs truncate" title={dec.reviewComments}>
                        "{dec.reviewComments}"
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(dec.reviewedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                        {dec.approvalSignatureSha.slice(0, 16)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
