import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Send, 
  Terminal
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';

export const SecurityJwtTab: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'evidence' | 'review' | 'tranche_get' | 'direct_payout'>('review');
  const [simulatedResponse, setSimulatedResponse] = useState<{
    status: number;
    statusText: string;
    body: unknown;
    headers: Record<string, string>;
  } | null>(null);

  const currentUser = simulationEngine.currentUser;
  const currentJwt = simulationEngine.currentJwt;
  const auditLogs = simulationEngine.auditLogs;

  const handleExecuteRestRequest = () => {
    const correlationId = 'corr-' + Math.random().toString(36).substring(2, 10);

    if (selectedEndpoint === 'review') {
      if (currentUser.role !== 'grantReviewer') {
        const errorBody = {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: `AccessDeniedException: Principal '${currentUser.name}' with role '${currentUser.role}' lacks required authority 'ROLE_grantReviewer'.`,
          path: '/api/v1/reviews/decisions',
          correlationId: correlationId
        };
        simulationEngine.addAuditLog('POST', '/api/v1/reviews/decisions', 'API-GATEWAY/SPRING-SECURITY', 403, `ACCESS DENIED: Role '${currentUser.role}' unauthorized for endpoint.`);
        setSimulatedResponse({
          status: 403,
          statusText: 'Forbidden',
          body: errorBody,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': correlationId,
            'access-control-allow-origin': 'https://applet.internal'
          }
        });
      } else {
        const successBody = {
          decisionId: 'REV-' + Math.random().toString(16).substring(2, 10),
          milestoneId: 'MLS-9042-01',
          decision: 'APPROVE',
          reviewerId: currentUser.id,
          message: 'Review recorded. Event MilestoneApproved dispatched to Kafka topic soa.s08.t03.events.',
          correlationId: correlationId
        };
        simulationEngine.addAuditLog('POST', '/api/v1/reviews/decisions', 'API-GATEWAY/SPRING-SECURITY', 200, `Authorized request processed for reviewer ${currentUser.name}.`);
        setSimulatedResponse({
          status: 200,
          statusText: 'OK',
          body: successBody,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': correlationId,
            'access-control-allow-origin': 'https://applet.internal'
          }
        });
      }
    } else if (selectedEndpoint === 'evidence') {
      if (currentUser.role !== 'grantee') {
        const errorBody = {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: `AccessDeniedException: Required role 'ROLE_grantee' not found in JWT claims for subject '${currentUser.id}'.`,
          path: '/api/v1/milestones/MLS-9042-01/evidence',
          correlationId: correlationId
        };
        simulationEngine.addAuditLog('POST', '/api/v1/milestones/MLS-9042-01/evidence', 'API-GATEWAY/SPRING-SECURITY', 403, `ACCESS DENIED: Role '${currentUser.role}' cannot submit evidence.`);
        setSimulatedResponse({
          status: 403,
          statusText: 'Forbidden',
          body: errorBody,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': correlationId
          }
        });
      } else {
        const successBody = {
          evidenceId: 'EVD-' + Math.random().toString(16).substring(2, 10),
          milestoneId: 'MLS-9042-01',
          status: 'EVIDENCE_SUBMITTED',
          submittedBy: currentUser.name,
          correlationId: correlationId
        };
        setSimulatedResponse({
          status: 201,
          statusText: 'Created',
          body: successBody,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': correlationId
          }
        });
      }
    } else if (selectedEndpoint === 'tranche_get') {
      if (currentUser.role === 'unauthorized') {
        setSimulatedResponse({
          status: 401,
          statusText: 'Unauthorized',
          body: { error: 'Full authentication is required to access this resource', path: '/api/v1/tranches/TRN-9042-01' },
          headers: { 'www-authenticate': 'Bearer error="invalid_token"' }
        });
      } else {
        setSimulatedResponse({
          status: 200,
          statusText: 'OK',
          body: simulationEngine.tranches[0],
          headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId }
        });
      }
    } else if (selectedEndpoint === 'direct_payout') {
      setSimulatedResponse({
        status: 405,
        statusText: 'Method Not Allowed',
        body: {
          error: 'ARCHITECTURE_VIOLATION: Direct tranche fund releases via HTTP REST are prohibited. Tranche releases are autonomous and Kafka event-driven only (Topic: soa.s08.t03.events).'
        },
        headers: { allow: 'GET, HEAD' }
      });
    }
  };

  const tokenParts = currentJwt.rawToken.split('.');

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Spring Security 6</span>
              <span>·</span>
              <span className="font-mono text-indigo-700 font-semibold">RS256 Signed JWT</span>
              <span>·</span>
              <span>B3 & CO2 Compliant</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Authentication, RBAC & Redacted Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Role-Based Access Control enforcing record-level permissions. Validates signatures in Gateway and domain services with NimbusJwtDecoder.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500">Active Subject:</span>
            <strong className="text-slate-900">{currentUser.name}</strong>
            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-semibold">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Live JWT Token Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Decoded JWT Token Structure
            </h2>
            <p className="text-xs text-slate-500">
              Issued by <code className="text-indigo-700 font-mono">http://auth-service:8081</code>
            </p>
          </div>
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Signature Valid (RS256)
          </span>
        </div>

        {/* Encoded Token Preview */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Raw Encoded Token String (Header.Payload.Signature):
          </label>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono break-all leading-relaxed text-slate-600">
            <span className="text-rose-600 font-semibold">{tokenParts[0]}</span>
            <span className="text-slate-400">.</span>
            <span className="text-indigo-600 font-semibold">{tokenParts[1]}</span>
            <span className="text-slate-400">.</span>
            <span className="text-sky-600 font-semibold">{tokenParts[2]}</span>
          </div>
        </div>

        {/* Header & Claims */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2">HEADER (Algorithm & Type)</div>
            <pre className="text-xs text-slate-700 font-mono">
              {JSON.stringify(currentJwt.header, null, 2)}
            </pre>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2">PAYLOAD (Subject & Role Claims)</div>
            <pre className="text-xs text-slate-700 font-mono">
              {JSON.stringify(currentJwt.payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* RBAC Matrix & Gateway REST Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Matrix */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2">
            Endpoint Permissions Matrix
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Security rules evaluated by Spring Cloud Gateway and Spring Security:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Endpoint</th>
                  <th className="py-2.5 px-3 text-center">grantee</th>
                  <th className="py-2.5 px-3 text-center">grantReviewer</th>
                  <th className="py-2.5 px-3 text-center">unauthorized</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">POST /milestones/evidence</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">200 ALLOW</td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">403 DENY</td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">401 DENY</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">POST /reviews/decisions</td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">403 DENY</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">200 ALLOW</td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">401 DENY</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">GET /tranches/{'{id}'}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">200 (Own)</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">200 (All)</td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-bold">401 DENY</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live REST Console (Test 403 Forbidden) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Gateway REST Console (Live Security Test)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch real requests through Gateway with your active persona to verify 200 OK vs 403 Forbidden.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Endpoint:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setSelectedEndpoint('review')}
                    className={`p-2.5 rounded-lg border text-left transition font-mono ${
                      selectedEndpoint === 'review'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-slate-900">POST /reviews/decisions</div>
                    <div className="text-[10px] text-slate-500 font-sans">Role required: grantReviewer</div>
                  </button>

                  <button
                    onClick={() => setSelectedEndpoint('evidence')}
                    className={`p-2.5 rounded-lg border text-left transition font-mono ${
                      selectedEndpoint === 'evidence'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-slate-900">POST /milestones/evidence</div>
                    <div className="text-[10px] text-slate-500 font-sans">Role required: grantee</div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleExecuteRestRequest}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Execute Request with Active Persona ({currentUser.name})</span>
              </button>
            </div>
          </div>

          {/* Response Box */}
          {simulatedResponse && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                <span className="text-slate-500">Gateway Response:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  simulatedResponse.status === 200 || simulatedResponse.status === 201
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {simulatedResponse.status} {simulatedResponse.statusText}
                </span>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(simulatedResponse.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Redacted Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Redacted Security Audit Log
            </h3>
            <p className="text-xs text-slate-500">
              B3 Compliance: Bearer token signatures masked before persistence; client IP and correlation IDs preserved.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {auditLogs.length} Events Logged
          </span>
        </div>

        <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100 font-mono text-[11px]">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-white hover:bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  log.statusCode === 200 || log.statusCode === 201
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}>
                  {log.statusCode}
                </span>
                <span className="text-slate-500">{log.method}</span>
                <span className="text-slate-900 font-semibold">{log.endpoint}</span>
                <span className="text-slate-400">[{log.service}]</span>
              </div>

              <div className="text-slate-500 text-[10px] flex items-center gap-3">
                <span className="text-slate-700 font-sans">{log.summary}</span>
                <span className="text-slate-400 hidden md:inline">{log.redactedAuthHeader}</span>
                <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
