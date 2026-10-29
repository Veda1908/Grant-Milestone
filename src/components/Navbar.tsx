import { 
  IndianRupee, 
  User, 
  ShieldCheck, 
  UserX,
  LayoutDashboard,
  FolderKanban,
  CheckCircle2,
  Receipt,
  UserCircle,
  Cpu
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/soa';
import { SEED_USERS } from '../data/seedData';
import { simulationEngine } from '../services/simulationEngine';

export type NavTab = 
  | 'dashboard'
  | 'grants'
  | 'milestones'
  | 'releases'
  | 'profile'
  | 'tech-overview';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, currentUser }) => {
  const handleUserChange = (role: UserRole) => {
    const user = SEED_USERS.find((u) => u.role === role);
    if (user) {
      simulationEngine.switchUser(user);
    }
  };

  const mainTabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'grants', label: 'Grants', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'milestones', label: 'Milestones', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'releases', label: 'Fund Releases', icon: <Receipt className="w-4 h-4" />, badge: simulationEngine.disbursementLedgers.length },
    { id: 'profile', label: 'Profile', icon: <UserCircle className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 shrink-0 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>GrantFund</span>
                <span className="text-[11px] font-normal text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 rounded-md">
                  Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Milestone-Based Fund Release System
              </div>
            </div>
          </div>

          {/* Primary Main Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {mainTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Area: Role Switcher, Reset, and Secondary Technical Overview */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden xl:block">
              <div className="text-[10px] text-slate-400">Current Role:</div>
              <div className="text-xs font-semibold text-slate-800 leading-none mt-0.5">
                {currentUser.role === 'grantee' && 'Applicant (Dr. Priya)'}
                {currentUser.role === 'grantReviewer' && 'Approver (Prof. Rajesh)'}
                {currentUser.role === 'unauthorized' && 'Guest (No Access)'}
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleUserChange('grantee')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  currentUser.role === 'grantee'
                    ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Applicant: Can view own grants and submit milestone evidence"
              >
                <User className="w-3.5 h-3.5" />
                <span>Applicant</span>
              </button>

              <button
                onClick={() => handleUserChange('grantReviewer')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  currentUser.role === 'grantReviewer'
                    ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Approver: Can review submitted evidence & authorize tranche release"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Approver</span>
              </button>

              <button
                onClick={() => handleUserChange('unauthorized')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  currentUser.role === 'unauthorized'
                    ? 'bg-white text-rose-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Guest (No Permissions): Demonstrates unauthorized rejection"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Guest</span>
              </button>
            </div>

            {/* Subtle Divider before Technical Overview */}
            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Far-Right Discreet Technical Overview Navigation Option */}
            <button
              onClick={() => onTabChange('tech-overview')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap border shrink-0 ${
                currentTab === 'tech-overview'
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="SOA System Architecture & Verification"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Technical Overview</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto pb-2 pt-1 gap-1 border-t border-slate-100 scrollbar-none">
          {mainTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => onTabChange('tech-overview')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1 ${
              currentTab === 'tech-overview'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-indigo-700 bg-indigo-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Tech Overview</span>
          </button>
        </div>
      </div>
    </header>
  );
};
