import {
  Grant,
  Milestone,
  Tranche,
  EvidenceSubmission,
  ReviewerDecision,
  DisbursementLedger,
  MilestoneApprovedEvent,
  ConsumedEventRecord,
  DeadLetterEvent,
  ServiceInstance,
  AuditLogEntry,
  UserProfile,
  UserRole,
  JwtToken,
  TestCaseResult,
  AppNotification
} from '../types/soa';
import {
  SEED_USERS,
  INITIAL_GRANTS,
  INITIAL_MILESTONES,
  INITIAL_TRANCHES,
  INITIAL_EVIDENCE,
  INITIAL_SERVICE_INSTANCES,
  INITIAL_TEST_CASES
} from '../data/seedData';

type Listener = () => void;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateHex(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.floor(Math.random() * 16).toString(16);
  }
  return s;
}

export class SimulationEngine {
  // Database Isolation:
  // 1. Grant DB
  public grants: Grant[] = JSON.parse(JSON.stringify(INITIAL_GRANTS));
  public selectedGrantId: string = INITIAL_GRANTS[0].id;
  public milestones: Milestone[] = JSON.parse(JSON.stringify(INITIAL_MILESTONES));
  public grantOutbox: { id: string; eventType: string; payload: unknown; status: string }[] = [];

  // 2. Review DB
  public evidenceSubmissions: EvidenceSubmission[] = JSON.parse(JSON.stringify(INITIAL_EVIDENCE));
  public reviewerDecisions: ReviewerDecision[] = [];
  public reviewOutbox: { id: string; eventType: string; payload: unknown; status: string }[] = [];

  // 3. Tranche DB
  public tranches: Tranche[] = JSON.parse(JSON.stringify(INITIAL_TRANCHES));
  public disbursementLedgers: DisbursementLedger[] = [];
  public consumedEvents: ConsumedEventRecord[] = [];

  // 4. Kafka Topics
  public kafkaTopicEvents: MilestoneApprovedEvent[] = [];
  public deadLetterQueue: DeadLetterEvent[] = [];

  // 5. Eureka & Service Instances
  public serviceInstances: ServiceInstance[] = JSON.parse(JSON.stringify(INITIAL_SERVICE_INSTANCES));
  public gatewayNextTrancheInstanceIndex = 0;

  // 6. Security, User Session & Audit
  public currentUser: UserProfile = SEED_USERS[0]; // Dr. Priya Sharma (grantee)
  public currentJwt: JwtToken = this.createJwtForUser(SEED_USERS[0]);
  public auditLogs: AuditLogEntry[] = [];
  public notifications: AppNotification[] = [
    {
      id: 'NOTIF-01',
      title: 'Milestone 1 Evidence Submitted',
      message: 'Evidence for Milestone 1 has been submitted and queued for review.',
      timestamp: '2024-04-18T14:32:00Z',
      read: false,
      type: 'submission',
      grantId: 'GRNT-9042',
      milestoneId: 'MLS-9042-01'
    },
    {
      id: 'NOTIF-02',
      title: 'Grant Allocation Approved',
      message: 'Grant DST-SERB-2024-C9042 for ₹30,00,000 has been registered.',
      timestamp: '2024-01-15T09:00:00Z',
      read: true,
      type: 'system',
      grantId: 'GRNT-9042'
    }
  ];

  // 7. Testing state
  public testCases: TestCaseResult[] = JSON.parse(JSON.stringify(INITIAL_TEST_CASES));
  public breakingContractEnabled = false;

  // Listeners
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initAuditLog();
  }

  public get activeGrant(): Grant {
    return this.grants.find((g) => g.id === this.selectedGrantId) || this.grants[0];
  }

  public get activeMilestones(): Milestone[] {
    return this.milestones.filter((m) => m.grantId === this.selectedGrantId);
  }

  public get activeTranches(): Tranche[] {
    return this.tranches.filter((t) => t.grantId === this.selectedGrantId);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private initAuditLog(): void {
    this.addAuditLog(
      'GET',
      '/eureka/apps',
      'EUREKA-SERVER',
      200,
      'System bootstrap completed. 7 instances registered across 2 zones.'
    );
  }

  public selectGrant(grantId: string): void {
    this.selectedGrantId = grantId;
    this.addAuditLog('GET', `/api/v1/grants/${grantId}`, 'GRANT-SERVICE', 200, `Selected active grant: ${grantId}`);
    this.notify();
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.notify();
    }
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
    this.notify();
  }

  public resetAll(): void {
    this.grants = JSON.parse(JSON.stringify(INITIAL_GRANTS));
    this.selectedGrantId = INITIAL_GRANTS[0].id;
    this.milestones = JSON.parse(JSON.stringify(INITIAL_MILESTONES));
    this.grantOutbox = [];
    this.evidenceSubmissions = JSON.parse(JSON.stringify(INITIAL_EVIDENCE));
    this.reviewerDecisions = [];
    this.reviewOutbox = [];
    this.tranches = JSON.parse(JSON.stringify(INITIAL_TRANCHES));
    this.disbursementLedgers = [];
    this.consumedEvents = [];
    this.kafkaTopicEvents = [];
    this.deadLetterQueue = [];
    this.serviceInstances = JSON.parse(JSON.stringify(INITIAL_SERVICE_INSTANCES));
    this.testCases = JSON.parse(JSON.stringify(INITIAL_TEST_CASES));
    this.breakingContractEnabled = false;
    this.currentUser = SEED_USERS[0];
    this.currentJwt = this.createJwtForUser(SEED_USERS[0]);
    this.notifications = [
      {
        id: 'NOTIF-01',
        title: 'Milestone 1 Evidence Submitted',
        message: 'Evidence for Milestone 1 has been submitted and queued for review.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'submission',
        grantId: 'GRNT-9042',
        milestoneId: 'MLS-9042-01'
      }
    ];
    this.addAuditLog('POST', '/api/v1/system/reset', 'API-GATEWAY', 200, 'All databases and Kafka topics reset.');
    this.notify();
  }

  public createGrant(
    title: string,
    organization: string,
    applicantName: string,
    milestoneConfigs: { title: string; description: string; trancheAmount: number }[]
  ): { success: boolean; grant?: Grant; message?: string } {
    if (this.currentUser.role !== 'grantee') {
      this.addAuditLog(
        'POST',
        '/api/v1/grants',
        'GRANT-SERVICE',
        403,
        `ACCESS DENIED: Role '${this.currentUser.role}' is not authorized to create grants. Only applicants can register grant proposals.`
      );
      this.notify();
      return { success: false, message: 'Access Denied: Only applicants can create grant proposals.' };
    }

    const grantNum = Math.floor(1000 + Math.random() * 9000);
    const grantId = `GRNT-${grantNum}`;
    const grantCode = `GOI-DST-2024-G${grantNum}`;

    const milestoneIds: string[] = [];
    let totalAmount = 0;

    milestoneConfigs.forEach((mConf, idx) => {
      const mNum = idx + 1;
      const mId = `MLS-${grantNum}-0${mNum}`;
      const tId = `TRN-${grantNum}-0${mNum}`;
      totalAmount += mConf.trancheAmount;
      milestoneIds.push(mId);

      const milestone: Milestone = {
        id: mId,
        grantId: grantId,
        milestoneNumber: mNum,
        title: mConf.title || `Milestone ${mNum}: Technical Validation & Prototype`,
        description: mConf.description || `Deliver scheduled engineering prototype and test results.`,
        deliverables: [
          `Phase ${mNum} Engineering Logbook & Documentation`,
          `Validation Test Report & Operational Metrics`,
          `Institutional Clearance Certificate`
        ],
        targetDate: `2025-0${mNum * 3}-28`,
        status: 'PENDING_EVIDENCE',
        trancheId: tId,
        trancheAmount: mConf.trancheAmount
      };

      const tranche: Tranche = {
        id: tId,
        grantId: grantId,
        milestoneId: mId,
        trancheNumber: mNum,
        amount: mConf.trancheAmount,
        currency: 'INR',
        status: 'LOCKED',
        recipientAccount: `NEFT-SBIN000${grantNum}-RESEARCH`,
      };

      this.milestones.push(milestone);
      this.tranches.push(tranche);
    });

    const newGrant: Grant = {
      id: grantId,
      grantCode: grantCode,
      title: title,
      granteeId: this.currentUser.id,
      granteeName: applicantName || this.currentUser.name,
      organization: organization || this.currentUser.organization,
      totalGrantAmount: totalAmount,
      disbursedAmount: 0,
      currency: 'INR',
      startDate: '2024-04-01',
      endDate: '2025-12-31',
      status: 'ACTIVE',
      milestoneIds: milestoneIds
    };

    this.grants.unshift(newGrant);
    this.selectedGrantId = newGrant.id;

    if (!this.currentUser.allowedGrantIds.includes(grantId)) {
      this.currentUser.allowedGrantIds.push(grantId);
      this.currentJwt = this.createJwtForUser(this.currentUser);
    }

    this.notifications.unshift({
      id: generateUUID(),
      title: 'New Grant Created',
      message: `Grant "${newGrant.title}" (₹${totalAmount.toLocaleString('en-IN')}) was created successfully.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'system',
      grantId: newGrant.id
    });

    this.addAuditLog(
      'POST',
      '/api/v1/grants',
      'GRANT-SERVICE',
      201,
      `New grant registered in grant_db: ${newGrant.title} (ID: ${newGrant.id}, Total: ₹${totalAmount.toLocaleString('en-IN')})`
    );

    this.notify();
    return { success: true, grant: newGrant };
  }

  public createJwtForUser(user: UserProfile): JwtToken {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;
    const kid = 'rsa-key-2024-soa';
    
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid
    };

    const payload = {
      sub: user.id,
      name: user.name,
      role: user.role,
      allowedGrantIds: user.allowedGrantIds,
      iss: 'http://auth-service:8081',
      aud: 'grant-ecosystem-gateway',
      iat: now,
      exp: exp,
      jti: generateUUID()
    };

    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const mockSig = generateHex(64);
    const rawToken = `${headerB64}.${payloadB64}.${mockSig}`;

    return {
      rawToken,
      header,
      payload,
      signature: mockSig,
      isValid: user.role !== 'unauthorized'
    };
  }

  public switchUser(user: UserProfile): void {
    this.currentUser = user;
    this.currentJwt = this.createJwtForUser(user);
    this.addAuditLog(
      'POST',
      '/api/v1/auth/token',
      'AUTH-SERVICE',
      200,
      `User session switched: ${user.name} (${user.role})`
    );
    this.notify();
  }

  public addAuditLog(
    method: string,
    endpoint: string,
    service: string,
    statusCode: number,
    summary: string
  ): void {
    const tokenPreview = this.currentJwt.rawToken.substring(0, 15);
    const redactedAuthHeader = `Bearer ${tokenPreview}...[REDACTED_SIGNATURE_${this.currentJwt.signature.substring(0, 8)}]`;

    const entry: AuditLogEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      service,
      statusCode,
      userId: this.currentUser.id,
      userRole: this.currentUser.role,
      correlationId: generateUUID(),
      clientIp: '192.168.1.104',
      summary,
      redactedAuthHeader
    };

    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 50) {
      this.auditLogs.pop();
    }
  }

  public getNextTrancheServiceInstance(): ServiceInstance | null {
    const trancheInstances = this.serviceInstances.filter(
      (s) => s.serviceName === 'TRANCHE-SERVICE' && s.status === 'UP'
    );

    if (trancheInstances.length === 0) return null;

    const instance = trancheInstances[this.gatewayNextTrancheInstanceIndex % trancheInstances.length];
    this.gatewayNextTrancheInstanceIndex++;
    instance.totalRequestsHandled++;
    return instance;
  }

  public toggleInstanceStatus(instanceId: string): void {
    const inst = this.serviceInstances.find((i) => i.instanceId === instanceId);
    if (inst) {
      inst.status = inst.status === 'UP' ? 'DOWN' : 'UP';
      inst.lastHeartbeat = new Date().toISOString();
      this.addAuditLog(
        'PUT',
        `/eureka/apps/${inst.serviceName}/${inst.instanceId}/status`,
        'EUREKA-SERVER',
        200,
        `Instance ${inst.instanceId} marked as ${inst.status}`
      );
      this.notify();
    }
  }

  public submitEvidence(milestoneId: string, title: string, description: string, metrics: string): { success: boolean; message: string; statusCode: number } {
    if (this.currentUser.role !== 'grantee') {
      this.addAuditLog(
        'POST',
        `/api/v1/milestones/${milestoneId}/evidence`,
        'GRANT-SERVICE',
        403,
        `ACCESS DENIED: Role '${this.currentUser.role}' is not authorized to submit evidence. Requires role 'grantee'.`
      );
      this.notify();
      return { success: false, message: 'Access Denied: Only applicants can submit milestone evidence.', statusCode: 403 };
    }

    const milestone = this.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      return { success: false, message: 'Milestone does not exist.', statusCode: 404 };
    }

    if (!this.currentUser.allowedGrantIds.includes('*') && !this.currentUser.allowedGrantIds.includes(milestone.grantId)) {
      this.addAuditLog(
        'POST',
        `/api/v1/milestones/${milestoneId}/evidence`,
        'GRANT-SERVICE',
        403,
        `ACCESS DENIED: Grantee ${this.currentUser.name} not permitted for grant ${milestone.grantId}.`
      );
      this.notify();
      return { success: false, message: 'Access Denied: You do not own this grant.', statusCode: 403 };
    }

    const evidence: EvidenceSubmission = {
      id: `EVD-${generateHex(8)}`,
      milestoneId: milestone.id,
      grantId: milestone.grantId,
      submittedBy: `${this.currentUser.name} (${this.currentUser.organization})`,
      submittedAt: new Date().toISOString(),
      title: title || 'Milestone Evidence Details',
      description: description || 'Submitted compliance metrics, telemetry logs and verification results.',
      documentUrl: `https://storage.cloud.gov.in/grants/${milestone.grantId}/evidence/${milestone.id}_submission.pdf`,
      checksumSha256: generateHex(64),
      metricsAchieved: metrics || '100% test criteria fulfilled per grant schedule.',
      version: 1
    };

    this.evidenceSubmissions.push(evidence);
    milestone.status = 'EVIDENCE_SUBMITTED';

    this.reviewOutbox.push({
      id: generateUUID(),
      eventType: 'EvidenceSubmitted',
      payload: evidence,
      status: 'PUBLISHED'
    });

    this.notifications.unshift({
      id: generateUUID(),
      title: `Evidence Submitted: Milestone ${milestone.milestoneNumber}`,
      message: `Deliverable documents for "${milestone.title}" submitted by ${this.currentUser.name}. Ready for reviewer sign-off.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'submission',
      grantId: milestone.grantId,
      milestoneId: milestone.id
    });

    this.addAuditLog(
      'POST',
      `/api/v1/milestones/${milestoneId}/evidence`,
      'MILESTONE-REVIEW-SERVICE',
      201,
      `Evidence ${evidence.id} accepted for Milestone ${milestone.milestoneNumber}. Status updated to EVIDENCE_SUBMITTED.`
    );

    this.notify();
    return { success: true, message: 'Evidence submitted successfully and queued for review.', statusCode: 201 };
  }

  public reviewMilestone(
    milestoneId: string,
    decision: 'APPROVE' | 'REJECT',
    comments: string
  ): { success: boolean; message: string; statusCode: number; event?: MilestoneApprovedEvent } {
    if (this.currentUser.role !== 'grantReviewer') {
      this.addAuditLog(
        'POST',
        `/api/v1/reviews/decisions`,
        'MILESTONE-REVIEW-SERVICE',
        403,
        `ACCESS DENIED: User role '${this.currentUser.role}' attempted review approval. Requires role 'grantReviewer'.`
      );
      this.notify();
      return {
        success: false,
        message: 'Access Denied: Only authorized approvers can record decisions.',
        statusCode: 403
      };
    }

    const milestone = this.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      return { success: false, message: 'Milestone not found.', statusCode: 404 };
    }

    if (milestone.status === 'APPROVED') {
      return { success: false, message: 'Milestone is already approved.', statusCode: 400 };
    }

    const reviewDecision: ReviewerDecision = {
      id: `REV-${generateHex(8)}`,
      milestoneId: milestone.id,
      grantId: milestone.grantId,
      reviewerId: this.currentUser.id,
      reviewerName: this.currentUser.name,
      decision: decision,
      reviewComments: comments,
      score: decision === 'APPROVE' ? 95 : 45,
      reviewedAt: new Date().toISOString(),
      approvalSignatureSha: generateHex(64)
    };
    this.reviewerDecisions.push(reviewDecision);

    if (decision === 'REJECT') {
      milestone.status = 'REJECTED';
      this.notifications.unshift({
        id: generateUUID(),
        title: `Milestone ${milestone.milestoneNumber} Revisions Requested`,
        message: `Reviewer requested changes: "${comments}". Please update and resubmit evidence.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'approval',
        grantId: milestone.grantId,
        milestoneId: milestone.id
      });
      this.addAuditLog(
        'POST',
        `/api/v1/reviews/decisions`,
        'MILESTONE-REVIEW-SERVICE',
        200,
        `Review recorded: REJECTED milestone ${milestone.milestoneNumber}.`
      );
      this.notify();
      return { success: true, message: 'Milestone was rejected with reviewer feedback.', statusCode: 200 };
    }

    // APPROVE
    milestone.status = 'APPROVED';
    milestone.approvedAt = new Date().toISOString();
    milestone.reviewerId = this.currentUser.id;

    const correlationId = generateUUID();
    const eventId = generateUUID();

    const approvalEvent: MilestoneApprovedEvent = {
      eventId: eventId,
      eventType: 'MilestoneApproved',
      aggregateId: milestone.id,
      schemaVersion: this.breakingContractEnabled ? '2.0.0-INCOMPATIBLE' : '1.0.0',
      occurredAt: new Date().toISOString(),
      correlationId: correlationId,
      producerService: 'milestone-review-service',
      topic: 'soa.s08.t03.events',
      partitionKey: milestone.id,
      payload: {
        grantId: milestone.grantId,
        milestoneId: milestone.id,
        milestoneNumber: milestone.milestoneNumber,
        trancheId: milestone.trancheId,
        approvedAmount: milestone.trancheAmount,
        reviewerId: this.currentUser.id,
        reviewerName: this.currentUser.name,
        reviewComments: comments,
        approvalHash: reviewDecision.approvalSignatureSha,
        decisionTimestamp: reviewDecision.reviewedAt
      }
    };

    this.reviewOutbox.push({
      id: generateUUID(),
      eventType: 'MilestoneApproved',
      payload: approvalEvent,
      status: 'PUBLISHED_TO_KAFKA'
    });

    this.kafkaTopicEvents.unshift(approvalEvent);

    this.addAuditLog(
      'POST',
      `/api/v1/reviews/decisions`,
      'MILESTONE-REVIEW-SERVICE',
      200,
      `Milestone ${milestone.milestoneNumber} APPROVED. MilestoneApproved event dispatched.`
    );

    // Consume Event in Tranche Service: Makes tranche AUTHORIZED (Ready for Release)
    this.consumeMilestoneApprovedInTrancheService(approvalEvent);

    this.notifications.unshift({
      id: generateUUID(),
      title: `Milestone ${milestone.milestoneNumber} Approved`,
      message: `Approved by ${this.currentUser.name}. The associated funding installment of ₹${milestone.trancheAmount.toLocaleString('en-IN')} is ready for release.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'approval',
      grantId: milestone.grantId,
      milestoneId: milestone.id
    });

    this.notify();
    return {
      success: true,
      message: `Milestone ${milestone.milestoneNumber} approved successfully. The associated funding installment is ready for release.`,
      statusCode: 200,
      event: approvalEvent
    };
  }

  public consumeMilestoneApprovedInTrancheService(
    event: MilestoneApprovedEvent,
    isReplay = false
  ): { status: 'AUTHORIZED' | 'DUPLICATE_SKIPPED' | 'DLQ_ROUTED'; message: string; instanceUsed?: string } {
    const correlationId = event.correlationId;

    if (this.breakingContractEnabled) {
      const dlqEntry: DeadLetterEvent = {
        id: generateUUID(),
        originalTopic: 'soa.s08.t03.events',
        deadLetterTopic: 'soa.s08.t03.events.DLQ',
        eventId: event.eventId,
        errorReason: 'SCHEMA_VALIDATION_FAILURE: schemaVersion 2.0.0-INCOMPATIBLE violates Consumer Contract.',
        failedAt: new Date().toISOString(),
        retryCount: 3,
        payload: event
      };
      this.deadLetterQueue.unshift(dlqEntry);

      this.addAuditLog(
        'KAFKA_CONSUME',
        'soa.s08.t03.events',
        'TRANCHE-SERVICE',
        500,
        `[DLQ ROUTE] Event ${event.eventId} routed to Dead-Letter Queue.`
      );
      this.notify();
      return { status: 'DLQ_ROUTED', message: 'Event violated contract and was sent to Dead Letter Queue.' };
    }

    const alreadyConsumed = this.consumedEvents.find((c) => c.eventId === event.eventId);
    if (alreadyConsumed) {
      const skippedRecord: ConsumedEventRecord = {
        id: generateUUID(),
        eventId: event.eventId,
        consumerService: 'tranche-service',
        aggregateId: event.aggregateId,
        processedAt: new Date().toISOString(),
        status: 'SKIPPED_DUPLICATE'
      };
      this.consumedEvents.unshift(skippedRecord);

      this.addAuditLog(
        'KAFKA_CONSUME',
        'soa.s08.t03.events',
        'TRANCHE-SERVICE',
        200,
        `[IDEMPOTENCY] Event ${event.eventId} already in consumed_events. Skipped duplicate business effect.`
      );
      this.notify();
      return {
        status: 'DUPLICATE_SKIPPED',
        message: 'Duplicate event delivery detected. Business effect executed exactly once.'
      };
    }

    const instance = this.getNextTrancheServiceInstance();
    const instanceName = instance ? `${instance.instanceId} (${instance.port})` : 'tranche-service-fallback';

    this.consumedEvents.unshift({
      id: generateUUID(),
      eventId: event.eventId,
      consumerService: 'tranche-service',
      aggregateId: event.aggregateId,
      processedAt: new Date().toISOString(),
      status: 'PROCESSED'
    });

    // Mark the tranche as AUTHORIZED (Ready for Release)
    // Business Rule: Approving Milestone makes ONLY its tranche eligible!
    const tranche = this.tranches.find((t) => t.id === event.payload.trancheId);
    if (tranche && tranche.status === 'LOCKED') {
      tranche.status = 'AUTHORIZED'; // Ready for Release
      tranche.authorizedAt = new Date().toISOString();
      tranche.disbursedByServiceInstance = instanceName;

      const targetGrant = this.grants.find((g) => g.id === tranche.grantId);
      if (targetGrant) {
        targetGrant.disbursedAmount = this.tranches
          .filter((t) => t.grantId === targetGrant.id && t.status === 'DISBURSED')
          .reduce((sum, t) => sum + t.amount, 0);
      }

      this.addAuditLog(
        'KAFKA_CONSUME',
        'soa.s08.t03.events',
        `TRANCHE-SERVICE [${instanceName}]`,
        200,
        `Processed MilestoneApproved ${event.eventId}. Tranche ${tranche.id} marked as Ready for Release.`
      );
    }

    this.notify();
    return {
      status: 'AUTHORIZED',
      message: `MilestoneApproved event consumed. Tranche ${event.payload.trancheId} is ready for release.`,
      instanceUsed: instanceName
    };
  }

  /**
   * Requirement 9: Separate Authorized Release Action
   * Authorize and disburse funds for an approved tranche
   */
  public releaseTrancheFunds(trancheId: string): { success: boolean; message: string; statusCode: number } {
    if (this.currentUser.role !== 'grantReviewer') {
      this.addAuditLog(
        'POST',
        `/api/v1/tranches/${trancheId}/release`,
        'TRANCHE-SERVICE',
        403,
        `ACCESS DENIED: Role '${this.currentUser.role}' is not authorized to disburse funds. Requires role 'grantReviewer'.`
      );
      this.notify();
      return { success: false, message: 'Access Denied: Only authorized approvers can release funds.', statusCode: 403 };
    }

    const tranche = this.tranches.find((t) => t.id === trancheId);
    if (!tranche) {
      return { success: false, message: 'Tranche not found.', statusCode: 404 };
    }

    if (tranche.status === 'DISBURSED') {
      return { success: false, message: 'This tranche has already been released.', statusCode: 400 };
    }

    if (tranche.status !== 'AUTHORIZED') {
      return { success: false, message: 'Cannot release funds: Milestone must be approved first.', statusCode: 400 };
    }

    const instance = this.getNextTrancheServiceInstance();
    const instanceName = instance ? `${instance.instanceId} (${instance.port})` : 'tranche-service-fallback';

    tranche.status = 'DISBURSED';
    tranche.disbursedAt = new Date().toISOString();
    tranche.transactionHash = '0x' + generateHex(32);
    tranche.disbursedByServiceInstance = instanceName;

    // Create ledger entry
    const ledgerEntry: DisbursementLedger = {
      id: `LDG-${generateHex(8)}`,
      trancheId: tranche.id,
      grantId: tranche.grantId,
      amount: tranche.amount,
      currency: 'INR',
      releasedAt: new Date().toISOString(),
      transactionRef: tranche.transactionHash,
      consumedEventId: `EVT-AUTH-${tranche.id}`,
      correlationId: generateUUID(),
      status: 'SETTLED'
    };
    this.disbursementLedgers.unshift(ledgerEntry);

    const targetGrant = this.grants.find((g) => g.id === tranche.grantId);
    if (targetGrant) {
      targetGrant.disbursedAmount = this.tranches
        .filter((t) => t.grantId === targetGrant.id && t.status === 'DISBURSED')
        .reduce((sum, t) => sum + t.amount, 0);
      if (targetGrant.disbursedAmount >= targetGrant.totalGrantAmount) {
        targetGrant.status = 'COMPLETED';
      }
    }

    this.notifications.unshift({
      id: generateUUID(),
      title: 'Funds Released to Bank',
      message: `Installment of ₹${tranche.amount.toLocaleString('en-IN')} has been released to ${tranche.recipientAccount}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'release',
      grantId: tranche.grantId
    });

    this.addAuditLog(
      'POST',
      `/api/v1/tranches/${tranche.id}/release`,
      `TRANCHE-SERVICE [${instanceName}]`,
      200,
      `Funds released: ₹${tranche.amount.toLocaleString('en-IN')} to ${tranche.recipientAccount}. Ref: ${tranche.transactionHash}`
    );

    this.notify();
    return {
      success: true,
      message: `Funds of ₹${tranche.amount.toLocaleString('en-IN')} released successfully.`,
      statusCode: 200
    };
  }

  public triggerDuplicateEventDelivery(eventId: string): { success: boolean; message: string } {
    const event = this.kafkaTopicEvents.find((e) => e.eventId === eventId);
    if (!event) {
      return { success: false, message: 'Event not found in Kafka topic.' };
    }

    const result = this.consumeMilestoneApprovedInTrancheService(event, true);
    return {
      success: true,
      message: result.message
    };
  }

  public triggerMalformedEventToDLQ(): void {
    const poisonedEventId = generateUUID();
    const badPayload = {
      corruptedField: 'NULL_POINTER_EXCEPTION',
      missingExpectedFields: ['approvedAmount', 'trancheId']
    };

    const dlqItem: DeadLetterEvent = {
      id: generateUUID(),
      originalTopic: 'soa.s08.t03.events',
      deadLetterTopic: 'soa.s08.t03.events.DLQ',
      eventId: poisonedEventId,
      errorReason: 'DESERIALIZATION_FAILURE: Required fields missing from payload',
      failedAt: new Date().toISOString(),
      retryCount: 3,
      payload: badPayload
    };

    this.deadLetterQueue.unshift(dlqItem);
    this.addAuditLog(
      'KAFKA_ROUTER',
      'soa.s08.t03.events -> soa.s08.t03.events.DLQ',
      'API-GATEWAY/KAFKA',
      500,
      `Routed unparseable message [${poisonedEventId}] to dead-letter queue soa.s08.t03.events.DLQ.`
    );
    this.notify();
  }

  public setBreakingContract(enabled: boolean): void {
    this.breakingContractEnabled = enabled;
    const contractTest = this.testCases.find((t) => t.id === 'TEST-06');
    if (contractTest) {
      if (enabled) {
        contractTest.status = 'FAILED';
        contractTest.details = 'PactVerificationException: Incompatible schema version 2.0.0 detected. Field mismatch with consumer contract.';
      } else {
        contractTest.status = 'PASSED';
        contractTest.details = 'Contract schema matched producer expectation.';
      }
    }
    this.notify();
  }

  public runAllTests(): void {
    this.testCases.forEach((t) => {
      t.status = 'PENDING';
    });
    this.notify();

    setTimeout(() => {
      this.testCases.forEach((t) => {
        if (t.id === 'TEST-06' && this.breakingContractEnabled) {
          t.status = 'FAILED';
        } else {
          t.status = 'PASSED';
        }
      });
      this.addAuditLog(
        'POST',
        '/ci/runner/execute',
        'CI/CD-RUNNER',
        this.breakingContractEnabled ? 500 : 200,
        `Automated test execution completed. ${this.testCases.filter(t => t.status === 'PASSED').length}/${this.testCases.length} tests passed.`
      );
      this.notify();
    }, 600);
  }
}

export const simulationEngine = new SimulationEngine();
