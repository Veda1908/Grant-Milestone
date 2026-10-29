import React from 'react';
import { 
  X, 
  User, 
  Building, 
  Mail, 
  ShieldCheck, 
  Key, 
  RotateCcw, 
  Check, 
  Info,
  Server
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { SEED_USERS } from '../data/seedData';
import { UserRole } from '../types/soa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentUser = simulationEngine.currentUser;
  const currentJwt = simulationEngine.currentJwt;

  const handleSwitchUser = (role: UserRole) => {
    const user = SEED_USERS.find((u) => u.role === role);
    if (user) {
      simulationEngine.switchUser(user);
    }
  };

  const handleReset = () => {
    simulationEngine.resetAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 text-xs my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">User Profile & Demo Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mt-4">
          {/* Active User Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                currentUser.role === 'grantee'
                  ? 'bg-emerald-600'
                  : currentUser.role === 'grantReviewer'
                  ? 'bg-indigo-600'
                  : 'bg-slate-500'
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
                <div className="text-slate-500 text-xs">{currentUser.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Organization</span>
                <span className="font-medium text-slate-800">{currentUser.organization}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned JWT Role</span>
                <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 inline-block">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Switch Active Role (Demo Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSwitchUser('grantee')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  currentUser.role === 'grantee'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold ring-1 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Applicant</div>
                <div className="text-[10px] text-slate-500">Dr. Priya Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchUser('grantReviewer')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  currentUser.role === 'grantReviewer'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 font-semibold ring-1 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Approver</div>
                <div className="text-[10px] text-slate-500">Prof. Rajesh Nair</div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchUser('unauthorized')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  currentUser.role === 'unauthorized'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-900 font-semibold ring-1 ring-rose-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">Guest</div>
                <div className="text-[10px] text-slate-500">Unauthenticated</div>
              </button>
            </div>
          </div>

          {/* Token Claims Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulated RS256 Bearer Token Claims:</span>
            </div>
            <div className="font-mono text-[10px] bg-white p-2 rounded border border-slate-200 text-slate-700 overflow-x-auto">
              <div>"sub": "{currentJwt.payload.sub}",</div>
              <div>"role": "{currentJwt.payload.role}",</div>
              <div>"allowedGrantIds": {JSON.stringify(currentJwt.payload.allowedGrantIds)},</div>
              <div>"iss": "{currentJwt.payload.iss}",</div>
              <div>"aud": "{currentJwt.payload.aud}"</div>
            </div>
          </div>

          {/* Reset Demo Data Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 p-1.5 rounded-md hover:bg-rose-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Simulated Data</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
