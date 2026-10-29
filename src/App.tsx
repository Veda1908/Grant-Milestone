import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { RoleBasedDashboard } from './components/RoleBasedDashboard';
import { GrantsTab } from './components/GrantsTab';
import { MilestonesTab } from './components/MilestonesTab';
import { ReleasesTab } from './components/ReleasesTab';
import { ProfileTab } from './components/ProfileTab';
import { TechnicalOverviewTab } from './components/TechnicalOverviewTab';
import { simulationEngine } from './services/simulationEngine';
import { Shield, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [, setTick] = useState(0);

  // Subscribe to simulation updates
  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navigation & Status Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={simulationEngine.currentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <RoleBasedDashboard
            currentUser={simulationEngine.currentUser}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'grants' && (
          <GrantsTab
            currentUser={simulationEngine.currentUser}
            onSelectGrant={() => setCurrentTab('milestones')}
          />
        )}

        {currentTab === 'milestones' && (
          <MilestonesTab
            currentUser={simulationEngine.currentUser}
          />
        )}

        {currentTab === 'releases' && (
          <ReleasesTab currentUser={simulationEngine.currentUser} />
        )}

        {currentTab === 'profile' && (
          <ProfileTab
            currentUser={simulationEngine.currentUser}
          />
        )}

        {currentTab === 'tech-overview' && (
          <TechnicalOverviewTab
            onBackToDashboard={() => setCurrentTab('dashboard')}
            currentUser={simulationEngine.currentUser}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">GrantFund Portal</span>
            <span className="text-slate-300">·</span>
            <span>Milestone Evidence & Fund Release System</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Currency: <strong className="text-slate-700">INR (₹)</strong></span>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setCurrentTab('tech-overview')}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Technical Overview
            </button>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CO1–CO4 Compliant
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
