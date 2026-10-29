import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Activity, 
  Power, 
  Shuffle
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { formatRupees } from '../utils/formatters';

export const InfrastructureTab: React.FC = () => {
  const [activeDbTab, setActiveDbTab] = useState<'grant_db' | 'review_db' | 'tranche_db' | 'auth_db'>('grant_db');
  const serviceInstances = simulationEngine.serviceInstances;

  const handleToggleInstance = (instanceId: string) => {
    simulationEngine.toggleInstanceStatus(instanceId);
  };

  const trancheInstances = serviceInstances.filter((s) => s.serviceName === 'TRANCHE-SERVICE');
  const upTrancheInstances = trancheInstances.filter((s) => s.status === 'UP');

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Eureka Service Discovery</span>
              <span>·</span>
              <span className="font-mono text-indigo-700 font-semibold">eureka-server:8761</span>
              <span>·</span>
              <span>B4 & CO3 Compliant</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Service Registry, Gateway & Isolated JPA Databases
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Spring Cloud Gateway routes requests using Eureka discovery names (<code className="text-indigo-700">lb://</code>). Each microservice owns its own isolated PostgreSQL database schema.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Active Instances</span>
            <div className="text-xl font-bold text-emerald-700 font-mono">
              {serviceInstances.filter((s) => s.status === 'UP').length} / {serviceInstances.length} UP
            </div>
          </div>
        </div>
      </div>

      {/* Eureka Instance Table & Load Balancing Demo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Registered Microservice Instances
            </h2>
            <p className="text-xs text-slate-500">
              Eureka heartbeats active • Client load balancing via Spring Cloud LoadBalancer
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Discovery Application</th>
                <th className="py-2.5 px-3">Instance ID & Host</th>
                <th className="py-2.5 px-3">Port</th>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3">Requests</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Failover Demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceInstances.map((inst) => {
                const isTranche = inst.serviceName === 'TRANCHE-SERVICE';
                const isUp = inst.status === 'UP';

                return (
                  <tr key={inst.instanceId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-semibold text-slate-900 font-sans">
                      {inst.serviceName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{inst.instanceId}</td>
                    <td className="py-3 px-3 text-indigo-700 font-bold">:{inst.port}</td>
                    <td className="py-3 px-3 text-slate-500">{inst.zone}</td>
                    <td className="py-3 px-3 text-slate-700 tabular-nums">{inst.totalRequestsHandled}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium border ${
                        isUp 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isTranche ? (
                        <button
                          onClick={() => handleToggleInstance(inst.instanceId)}
                          className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition inline-flex items-center gap-1 border shadow-sm ${
                            isUp
                              ? 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isUp ? 'Stop Instance' : 'Revive Instance'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans">Core Service</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Load Balancing & Failover Demonstration Banner */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
          <div className="flex items-start gap-3">
            <Shuffle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xs font-bold text-slate-900">
                B4 Demonstration: 2 Tranche Instances, Gateway Load Balancing & Instant Failover
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                When both instances are UP, Spring Cloud Gateway balances requests across Zone 1a and Zone 1b. If you click &ldquo;Stop Instance&rdquo; on Instance 1, Eureka marks it down and Gateway automatically reroutes 100% of disbursement traffic to Instance 2 with zero lost transactions.
              </p>

              <div className="mt-2 text-xs font-mono text-indigo-800">
                Current Routing State: {upTrancheInstances.length === 2 ? (
                  <span>Round-Robin distribution across both instances (50% / 50%).</span>
                ) : upTrancheInstances.length === 1 ? (
                  <span className="text-amber-800 font-semibold">
                    Failover Active: One instance stopped. All disbursement requests routed safely to {upTrancheInstances[0]?.instanceId}.
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold">All instances stopped. Gateway will return 503.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Service Isolated JPA Stores */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Per-Service Isolated JPA Databases
            </h2>
            <p className="text-xs text-slate-500">
              B4 Compliance: Each microservice owns its schema with separate credentials. Cross-database queries are strictly prohibited.
            </p>
          </div>

          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveDbTab('grant_db')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeDbTab === 'grant_db' ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              grant_db (:5432)
            </button>
            <button
              onClick={() => setActiveDbTab('review_db')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeDbTab === 'review_db' ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              review_db (:5433)
            </button>
            <button
              onClick={() => setActiveDbTab('tranche_db')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeDbTab === 'tranche_db' ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              tranche_db (:5434)
            </button>
            <button
              onClick={() => setActiveDbTab('auth_db')}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                activeDbTab === 'auth_db' ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              auth_db (:5431)
            </button>
          </div>
        </div>

        {/* Database Content Views */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-xs">
          {activeDbTab === 'grant_db' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 font-mono">
                Tables: <strong className="text-slate-700">grants</strong>, <strong className="text-slate-700">milestones</strong> · JDBC: jdbc:postgresql://grant-db:5432/grant_service_db
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Table: grants</div>
                <div className="overflow-x-auto bg-white rounded border border-slate-200">
                  <table className="w-full text-left font-mono text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">id (PK)</th>
                        <th className="p-2">grant_code</th>
                        <th className="p-2">grantee_id</th>
                        <th className="p-2">total_amount</th>
                        <th className="p-2">disbursed_amount</th>
                        <th className="p-2">status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 text-indigo-700 font-bold">{simulationEngine.activeGrant.id}</td>
                        <td className="p-2">{simulationEngine.activeGrant.grantCode}</td>
                        <td className="p-2 text-slate-500">{simulationEngine.activeGrant.granteeId}</td>
                        <td className="p-2">{formatRupees(simulationEngine.activeGrant.totalGrantAmount)}</td>
                        <td className="p-2 text-emerald-700 font-bold">{formatRupees(simulationEngine.activeGrant.disbursedAmount)}</td>
                        <td className="p-2 text-slate-800">{simulationEngine.activeGrant.status}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeDbTab === 'review_db' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 font-mono">
                Tables: <strong className="text-slate-700">evidence_submissions</strong>, <strong className="text-slate-700">reviewer_decisions</strong> · JDBC: jdbc:postgresql://review-db:5433/review_service_db
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Table: evidence_submissions ({simulationEngine.evidenceSubmissions.length} rows)</div>
                <div className="overflow-x-auto bg-white rounded border border-slate-200">
                  <table className="w-full text-left font-mono text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">id (PK)</th>
                        <th className="p-2">milestone_id</th>
                        <th className="p-2">submitted_by</th>
                        <th className="p-2">checksum_sha256</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulationEngine.evidenceSubmissions.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2 text-indigo-700">{e.id}</td>
                          <td className="p-2 text-slate-700">{e.milestoneId}</td>
                          <td className="p-2">{e.submittedBy}</td>
                          <td className="p-2 text-slate-400">{e.checksumSha256.substring(0, 16)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeDbTab === 'tranche_db' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 font-mono">
                Tables: <strong className="text-slate-700">tranches</strong>, <strong className="text-slate-700">disbursement_ledgers</strong>, <strong className="text-slate-700">consumed_events</strong> · JDBC: jdbc:postgresql://tranche-db:5434/tranche_service_db
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Table: tranches</div>
                <div className="overflow-x-auto bg-white rounded border border-slate-200">
                  <table className="w-full text-left font-mono text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">id (PK)</th>
                        <th className="p-2">amount</th>
                        <th className="p-2">status</th>
                        <th className="p-2">recipient_account</th>
                        <th className="p-2">transaction_hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulationEngine.tranches.map((t) => (
                        <tr key={t.id}>
                          <td className="p-2 text-indigo-700 font-bold">{t.id}</td>
                          <td className="p-2 font-bold">{formatRupees(t.amount)}</td>
                          <td className="p-2 font-semibold">
                            <span className={t.status === 'DISBURSED' ? 'text-emerald-700' : 'text-amber-700'}>
                              {t.status}
                            </span>
                          </td>
                          <td className="p-2 text-slate-500">{t.recipientAccount}</td>
                          <td className="p-2 text-slate-400">{t.transactionHash ? t.transactionHash.substring(0, 16) + '...' : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeDbTab === 'auth_db' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 font-mono">
                Tables: <strong className="text-slate-700">users</strong>, <strong className="text-slate-700">roles</strong> · JDBC: jdbc:postgresql://auth-db:5431/auth_service_db
              </div>

              <div>
                <div className="font-semibold text-slate-800 mb-1">Table: users</div>
                <div className="overflow-x-auto bg-white rounded border border-slate-200">
                  <table className="w-full text-left font-mono text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2">id (PK)</th>
                        <th className="p-2">username</th>
                        <th className="p-2">role</th>
                        <th className="p-2">allowed_grant_ids</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2 text-indigo-700">USR-GRANTEE-01</td>
                        <td className="p-2">Alice Chen</td>
                        <td className="p-2 text-indigo-700 font-bold">grantee</td>
                        <td className="p-2">['GRNT-9042']</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-indigo-700">USR-REVIEWER-01</td>
                        <td className="p-2">Dr. Marcus Vance</td>
                        <td className="p-2 text-emerald-700 font-bold">grantReviewer</td>
                        <td className="p-2">['*'] (All)</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-indigo-700">USR-UNAUTH-01</td>
                        <td className="p-2">Eve Mallory</td>
                        <td className="p-2 text-rose-700 font-bold">unauthorized</td>
                        <td className="p-2">[] (None)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
