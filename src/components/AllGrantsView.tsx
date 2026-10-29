import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  ChevronRight, 
  Calendar,
  Filter
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';

interface AllGrantsViewProps {
  onSelectGrant?: (grantId: string) => void;
  onNavigateToReviews?: () => void;
}

export const AllGrantsView: React.FC<AllGrantsViewProps> = ({ 
  onSelectGrant,
  onNavigateToReviews 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const grants = simulationEngine.grants;

  const filteredGrants = grants.filter((g) => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.grantCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.granteeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            All Research Grants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional overview of active grants, milestone delivery tracking, and allocated tranches.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search grants or institutions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGrants.map((grant) => {
          const milestones = simulationEngine.milestones.filter((m) => m.grantId === grant.id);
          const tranches = simulationEngine.tranches.filter((t) => t.grantId === grant.id);
          const completedCount = milestones.filter((m) => m.status === 'APPROVED').length;
          const progressPercent = Math.round((completedCount / (milestones.length || 1)) * 100);

          return (
            <div 
              key={grant.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {grant.grantCode}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {grant.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {grant.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{grant.organization}</span>
                  <span className="text-slate-300">·</span>
                  <span>{grant.granteeName}</span>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Total Funding</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {formatRupees(grant.totalGrantAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Disbursed</span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      {formatRupees(grant.disbursedAmount)}
                    </span>
                  </div>
                </div>

                {/* Milestone Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Milestone Progress</span>
                    <span className="font-medium">{completedCount} of {milestones.length} ({progressPercent}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {milestones.filter(m => m.status === 'EVIDENCE_SUBMITTED').length} pending review
                </span>

                <button
                  onClick={() => {
                    simulationEngine.selectedGrantId = grant.id;
                    if (onSelectGrant) onSelectGrant(grant.id);
                    if (onNavigateToReviews) onNavigateToReviews();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Inspect Milestones</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
