import React, { useState } from 'react';
import { 
  Cpu, 
  Radio, 
  Server, 
  Shield, 
  FlaskConical, 
  FileCode, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { KafkaEventBusTab } from './KafkaEventBusTab';
import { InfrastructureTab } from './InfrastructureTab';
import { SecurityJwtTab } from './SecurityJwtTab';
import { TestAutomationTab } from './TestAutomationTab';
import { ArchitectureDocsTab } from './ArchitectureDocsTab';
import { simulationEngine } from '../services/simulationEngine';

export type TechSubTab = 'kafka' | 'infrastructure' | 'security' | 'tests' | 'docs';

interface TechnicalOverviewViewProps {
  initialSubTab?: TechSubTab;
}

export const TechnicalOverviewView: React.FC<TechnicalOverviewViewProps> = ({ 
  initialSubTab = 'kafka' 
}) => {
  const [activeTab, setActiveTab] = useState<TechSubTab>(initialSubTab);

  const subTabs: { id: TechSubTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { 
      id: 'kafka', 
      label: 'Kafka Event Bus', 
      icon: <Radio className="w-4 h-4 text-amber-600" />,
      badge: `${simulationEngine.kafkaTopicEvents.length} events`
    },
    { 
      id: 'infrastructure', 
      label: 'Eureka & Databases', 
      icon: <Server className="w-4 h-4 text-emerald-600" />,
      badge: '5 Services UP'
    },
    { 
      id: 'security', 
      label: 'Security & Access Control', 
      icon: <Shield className="w-4 h-4 text-indigo-600" />,
      badge: 'JWT RS256'
    },
    { 
      id: 'tests', 
      label: 'Automated Tests', 
      icon: <FlaskConical className="w-4 h-4 text-emerald-600" />,
      badge: '18 Passed'
    },
    { 
      id: 'docs', 
      label: 'SOA Specification & Contracts', 
      icon: <FileCode className="w-4 h-4 text-slate-600" />
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>SOA Architecture & Evaluation Console</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Technical Overview (B1–B6 / CO1–CO4)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Simulated enterprise microservices backend implementing Apache Kafka choreography, Netflix Eureka service discovery, Spring Cloud Gateway (:8080), isolated per-service PostgreSQL schemas, and Spring Security JWT validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px]">
              Topic: <strong className="text-amber-800">soa.s08.t03.events</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Evaluation Mode Active
            </span>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto scrollbar-none">
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      <div className="transition-all duration-200">
        {activeTab === 'kafka' && <KafkaEventBusTab />}
        {activeTab === 'infrastructure' && <InfrastructureTab />}
        {activeTab === 'security' && <SecurityJwtTab />}
        {activeTab === 'tests' && <TestAutomationTab />}
        {activeTab === 'docs' && <ArchitectureDocsTab />}
      </div>
    </div>
  );
};
