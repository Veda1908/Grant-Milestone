import React from 'react';
import { 
  UserCircle, 
  Building2, 
  Mail, 
  ShieldCheck, 
  Key, 
  CreditCard,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { UserProfile, UserRole } from '../types/soa';
import { SEED_USERS } from '../data/seedData';

interface ProfileTabProps {
  currentUser: UserProfile;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ currentUser }) => {
  const currentJwt = simulationEngine.currentJwt;

  const handleRoleChange = (role: UserRole) => {
    const user = SEED_USERS.find((u) => u.role === role);
    if (user) {
      simulationEngine.switchUser(user);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl border border-emerald-200">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser.email}</span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">{currentUser.role}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Institutional ID</span>
            <div className="text-xs font-mono font-bold text-slate-700">{currentUser.id}</div>
          </div>
        </div>
      </div>

      {/* Role & Permissions Switcher Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          User Role & Access Persona
        </h2>
        <p className="text-xs text-slate-500">
          Switch roles to experience how GrantFund changes between researchers uploading evidence and board members approving funds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {SEED_USERS.map((user) => {
            const isSelected = currentUser.role === user.role;
            return (
              <div
                key={user.id}
                onClick={() => handleRoleChange(user.role)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {user.role === 'grantee' && 'Applicant'}
                    {user.role === 'grantReviewer' && 'Approver'}
                    {user.role === 'unauthorized' && 'Guest'}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-1">{user.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{user.organization}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Institutional Bank & Profile Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Organization & Department</span>
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div><strong>Affiliation:</strong> {currentUser.organization}</div>
            <div><strong>Research Division:</strong> Applied Biotechnology & Sensors</div>
            <div><strong>Access Scope:</strong> {currentUser.allowedGrantIds.join(', ')}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Registered NEFT Bank Account</span>
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div><strong>Bank:</strong> State Bank of India (IISc Campus Branch)</div>
            <div><strong>IFSC Code:</strong> SBIN0004242</div>
            <div><strong>Account:</strong> **9042 (Institutional R&D Trust)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
