/**
 * SOA Hackathon (24SDCS03 / S08.T03): Grant Milestone Fund Release Platform
 * Domain Models, Event Envelopes, Microservices, and Infrastructure Types
 */

export type UserRole = 'grantee' | 'grantReviewer' | 'unauthorized';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  allowedGrantIds: string[];
}

export interface JwtToken {
  rawToken: string;
  header: {
    alg: string;
    typ: string;
    kid: string;
  };
  payload: {
    sub: string;
    name: string;
    role: UserRole;
    allowedGrantIds: string[];
    iss: string;
    aud: string;
    iat: number;
    exp: number;
    jti: string;
  };
  signature: string;
  isValid: boolean;
}

export type MilestoneStatus = 
  | 'PENDING_EVIDENCE'
  | 'EVIDENCE_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

// Tranche status: LOCKED, AUTHORIZED (Ready for Release), DISBURSED (Released), HELD
export type TrancheStatus = 
  | 'LOCKED'
  | 'AUTHORIZED'
  | 'DISBURSED'
  | 'HELD';

export interface Milestone {
  id: string;
  grantId: string;
  milestoneNumber: number;
  title: string;
  description: string;
  deliverables: string[];
  targetDate: string;
  status: MilestoneStatus;
  trancheId: string;
  trancheAmount: number;
  approvedAt?: string;
  reviewerId?: string;
}

export interface Grant {
  id: string;
  grantCode: string;
  title: string;
  granteeId: string;
  granteeName: string;
  organization: string;
  totalGrantAmount: number;
  disbursedAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
  milestoneIds: string[];
}

export interface EvidenceSubmission {
  id: string;
  milestoneId: string;
  grantId: string;
  submittedBy: string;
  submittedAt: string;
  title: string;
  description: string;
  documentUrl: string;
  checksumSha256: string;
  metricsAchieved: string;
  version: number;
}

export interface ReviewerDecision {
  id: string;
  milestoneId: string;
  grantId: string;
  reviewerId: string;
  reviewerName: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  reviewComments: string;
  score: number; // 1-100
  reviewedAt: string;
  approvalSignatureSha: string;
}

export interface Tranche {
  id: string;
  grantId: string;
  milestoneId: string;
  trancheNumber: number;
  amount: number;
  currency: string;
  status: TrancheStatus;
  authorizedAt?: string;
  disbursedAt?: string;
  recipientAccount: string;
  transactionHash?: string;
  disbursedByServiceInstance?: string;
}

export interface DisbursementLedger {
  id: string;
  trancheId: string;
  grantId: string;
  amount: number;
  currency: string;
  releasedAt: string;
  transactionRef: string;
  consumedEventId: string;
  correlationId: string;
  status: 'SETTLED' | 'PROCESSING';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'submission' | 'release' | 'system';
  grantId?: string;
  milestoneId?: string;
}

/**
 * Kafka Event Schema complying with B1 / CO1:
 * eventId, aggregateId, schemaVersion, occurredAt, correlationId
 */
export interface MilestoneApprovedEvent {
  eventId: string;
  eventType: 'MilestoneApproved';
  aggregateId: string; // milestoneId
  schemaVersion: string; // e.g. "1.0.0"
  occurredAt: string;
  correlationId: string;
  producerService: 'milestone-review-service';
  topic: 'soa.s08.t03.events';
  partitionKey: string; // milestoneId
  payload: {
    grantId: string;
    milestoneId: string;
    milestoneNumber: number;
    trancheId: string;
    approvedAmount: number;
    reviewerId: string;
    reviewerName: string;
    reviewComments: string;
    approvalHash: string;
    decisionTimestamp: string;
  };
}

export interface ConsumedEventRecord {
  id: string;
  eventId: string;
  consumerService: string;
  aggregateId: string;
  processedAt: string;
  status: 'PROCESSED' | 'SKIPPED_DUPLICATE';
}

export interface DeadLetterEvent {
  id: string;
  originalTopic: string;
  deadLetterTopic: 'soa.s08.t03.events.DLQ';
  eventId: string;
  errorReason: string;
  failedAt: string;
  retryCount: number;
  payload: unknown;
}

export interface ServiceInstance {
  instanceId: string;
  serviceName: string;
  host: string;
  port: number;
  status: 'UP' | 'DOWN' | 'STARTING';
  zone: string;
  lastHeartbeat: string;
  totalRequestsHandled: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  service: string;
  statusCode: number;
  userId: string;
  userRole: UserRole;
  correlationId: string;
  clientIp: string;
  summary: string;
  redactedAuthHeader: string;
}

export interface TestCaseResult {
  id: string;
  name: string;
  type: 'JUnit5_AssertJ' | 'SpringBootTest' | 'DataJpaTest' | 'Contract_Pact';
  coTarget: 'CO1' | 'CO2' | 'CO3' | 'CO4';
  description: string;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  durationMs: number;
  details: string;
  codeSnippet: string;
}
