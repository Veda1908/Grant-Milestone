import React, { useState } from 'react';
import { 
  Radio, 
  RotateCcw, 
  AlertTriangle, 
  Copy, 
  Check, 
  ShieldCheck, 
  Inbox, 
  AlertOctagon,
  FileJson
} from 'lucide-react';
import { simulationEngine } from '../services/simulationEngine';
import { MilestoneApprovedEvent, DeadLetterEvent } from '../types/soa';
import { formatRupees } from '../utils/formatters';

export const KafkaEventBusTab: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<MilestoneApprovedEvent | null>(
    simulationEngine.kafkaTopicEvents.length > 0 ? simulationEngine.kafkaTopicEvents[0] : null
  );
  const [activeSubView, setActiveSubView] = useState<'events' | 'idempotency' | 'outbox' | 'dlq'>('events');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const events = simulationEngine.kafkaTopicEvents;
  const dlqEvents = simulationEngine.deadLetterQueue;
  const consumedEvents = simulationEngine.consumedEvents;
  const outboxEntries = simulationEngine.reviewOutbox;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDuplicateDelivery = (event: MilestoneApprovedEvent) => {
    const res = simulationEngine.triggerDuplicateEventDelivery(event.eventId);
    setActionNotice(res.message);
    setTimeout(() => setActionNotice(null), 7000);
  };

  const handleSendMalformedToDLQ = () => {
    simulationEngine.triggerMalformedEventToDLQ();
    setActiveSubView('dlq');
    setActionNotice('Dispatched poisoned payload to Kafka. Consumer schema validation routed event to soa.s08.t03.events.DLQ.');
    setTimeout(() => setActionNotice(null), 7000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-slate-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Apache Kafka Cluster</span>
              <span>·</span>
              <span className="font-mono text-amber-700 font-semibold">soa.s08.t03.events</span>
              <span>·</span>
              <span>B1 & B2 Event Reliability</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Event Broker & Idempotency Explorer
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Choreographed microservice bus. Owned by <code className="text-indigo-700">milestone-review-service</code> and consumed by <code className="text-emerald-700">tranche-service</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendMalformedToDLQ}
              className="bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Malformed Payload (DLQ)</span>
            </button>
          </div>
        </div>

        {/* Clean Segmented Tab Control */}
        <div className="flex space-x-1 mt-6 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveSubView('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSubView === 'events'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-600" />
            <span>Main Topic Stream ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('idempotency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSubView === 'idempotency'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Consumer Idempotency ({consumedEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('outbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSubView === 'outbox'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transactional Outbox ({outboxEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('dlq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeSubView === 'dlq'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Dead Letter Queue ({dlqEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Main Events View */}
      {activeSubView === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Event List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Messages on Topic</span>
              <span className="font-mono">{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs shadow-sm">
                No events on Kafka yet. Go to <strong className="text-slate-800">Workflow Demo</strong> and approve Milestone 1 to dispatch <code className="text-amber-700">MilestoneApproved</code>.
              </div>
            ) : (
              events.map((evt) => {
                const isSelected = selectedEvent?.eventId === evt.eventId;
                return (
                  <div
                    key={evt.eventId}
                    onClick={() => setSelectedEvent(evt)}
                    className={`bg-white p-4 rounded-xl border cursor-pointer transition shadow-sm ${
                      isSelected
                        ? 'border-indigo-400 ring-1 ring-indigo-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {evt.eventType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        v{evt.schemaVersion}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-700 flex items-center justify-between">
                      <span>Milestone: <strong className="text-slate-900">{evt.aggregateId}</strong></span>
                      <span className="text-emerald-700 font-bold tabular-nums">
                        +{formatRupees(evt.payload.approvedAmount)}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>Partition Key: {evt.partitionKey}</span>
                      <span>{new Date(evt.occurredAt).toLocaleTimeString()}</span>
                    </div>

                    {/* B2 Reliability Demo: Duplicate Delivery */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateDelivery(evt);
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] px-2.5 py-1 rounded-md transition flex items-center gap-1"
                        title="Delivers the same eventId again to verify idempotent processing"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>Deliver Duplicate (Test Idempotency)</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Envelope Inspector */}
          <div className="lg:col-span-7">
            {selectedEvent ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-indigo-600" />
                      Kafka Event Envelope & Metadata
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Standardized envelope: <code className="text-slate-700">eventId, aggregateId, schemaVersion, occurredAt, correlationId</code>
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedEvent, null, 2), selectedEvent.eventId)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded flex items-center gap-1 transition"
                  >
                    {copiedId === selectedEvent.eventId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-mono block">eventId (UUID)</span>
                    <span className="font-mono text-slate-800 text-[11px] break-all">{selectedEvent.eventId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-mono block">correlationId</span>
                    <span className="font-mono text-slate-800 text-[11px] break-all">{selectedEvent.correlationId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-mono block">aggregateId</span>
                    <span className="font-mono text-slate-800 text-[11px]">{selectedEvent.aggregateId}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-mono block">schemaVersion</span>
                    <span className="font-mono text-emerald-700 text-[11px]">{selectedEvent.schemaVersion}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">
                    Serialized Message Payload
                  </div>
                  <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-96 leading-relaxed">
                    {JSON.stringify(selectedEvent, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-sm">
                Select an event from the list to inspect headers and payload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Idempotency Table */}
      {activeSubView === 'idempotency' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Consumer Idempotency Store: <code className="text-emerald-700 text-sm">consumed_events</code>
              </h3>
              <p className="text-xs text-slate-500">
                Maintained in <code className="text-slate-700">tranche_db</code> (:5434). Indexed on <code className="text-slate-700">event_id</code>. Duplicate deliveries result in exactly 1 business disbursement.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">tranche_db</span>
          </div>

          {consumedEvents.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
              No events consumed yet. Approving Milestone 1 will register its event ID here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 font-mono text-[11px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Primary Key (event_id)</th>
                    <th className="py-2.5 px-3">Consumer</th>
                    <th className="py-2.5 px-3">Aggregate ID</th>
                    <th className="py-2.5 px-3">Processed At</th>
                    <th className="py-2.5 px-3">Execution Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumedEvents.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{c.eventId}</td>
                      <td className="py-2.5 px-3 text-indigo-700">{c.consumerService}</td>
                      <td className="py-2.5 px-3 text-slate-700">{c.aggregateId}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(c.processedAt).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-3">
                        {c.status === 'PROCESSED' ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                            FIRST DELIVERY: DISBURSED
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                            DUPLICATE SKIPPED (0 EFFECT)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Outbox View */}
      {activeSubView === 'outbox' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Transactional Outbox: <code className="text-indigo-700 text-sm">review_outbox</code>
              </h3>
              <p className="text-xs text-slate-500">
                Maintained in <code className="text-slate-700">review_db</code> (:5433). Prevents dual-write issues between database commits and Kafka broker dispatches.
              </p>
            </div>
          </div>

          {outboxEntries.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
              Outbox is currently idle. Approving a milestone writes an event to the local outbox first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 font-mono text-[11px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Outbox Entry ID</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Relay Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outboxEntries.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 px-3 text-slate-600">{o.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{o.eventType}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-sans font-medium">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dead Letter Queue */}
      {activeSubView === 'dlq' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dead Letter Queue: <code className="text-rose-700 text-sm">soa.s08.t03.events.DLQ</code>
              </h3>
              <p className="text-xs text-slate-500">
                Routes unprocessable or malformed payloads without halting active consumer threads.
              </p>
            </div>
            <button
              onClick={handleSendMalformedToDLQ}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-lg transition"
            >
              + Send Corrupted Event
            </button>
          </div>

          {dlqEvents.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
              Dead Letter Queue is empty. Click &ldquo;+ Send Corrupted Event&rdquo; to demonstrate DLQ routing.
            </div>
          ) : (
            <div className="space-y-3">
              {dlqEvents.map((dlq) => (
                <div key={dlq.id} className="bg-rose-50/50 border border-rose-200 rounded-lg p-4 text-xs">
                  <div className="flex items-center justify-between text-rose-800 font-mono font-semibold">
                    <span>DLQ ID: {dlq.id}</span>
                    <span>Retries: {dlq.retryCount} (Exhausted)</span>
                  </div>
                  <div className="mt-1 text-rose-700 font-mono text-[11px]">
                    <strong>Reason:</strong> {dlq.errorReason}
                  </div>
                  <div className="mt-2 text-slate-500 text-[10px]">
                    Failed at: {new Date(dlq.failedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
