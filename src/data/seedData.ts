import { 
  Grant, 
  Milestone, 
  Tranche, 
  UserProfile, 
  ServiceInstance, 
  TestCaseResult,
  EvidenceSubmission
} from '../types/soa';

export const SEED_USERS: UserProfile[] = [
  {
    id: 'USR-GRANTEE-01',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@iisc.ac.in',
    role: 'grantee',
    organization: 'Indian Institute of Science (IISc)',
    allowedGrantIds: ['GRNT-9042', 'GRNT-8810'],
  },
  {
    id: 'USR-REVIEWER-01',
    name: 'Prof. Rajesh Nair',
    email: 'r.nair@dst.gov.in',
    role: 'grantReviewer',
    organization: 'National Science & Engineering Research Board',
    allowedGrantIds: ['*'],
  },
  {
    id: 'USR-UNAUTH-01',
    name: 'External Guest (No Access)',
    email: 'guest@external.org',
    role: 'unauthorized',
    organization: 'Unverified External Observer',
    allowedGrantIds: [],
  },
];

export const INITIAL_GRANTS: Grant[] = [
  {
    id: 'GRNT-9042',
    grantCode: 'DST-SERB-2024-C9042',
    title: 'High-Efficiency Algal Carbon Capture & Photobioreactor Scaling',
    granteeId: 'USR-GRANTEE-01',
    granteeName: 'Dr. Priya Sharma',
    organization: 'Indian Institute of Science (IISc)',
    totalGrantAmount: 3000000, // ₹30,00,000 INR
    disbursedAmount: 0,
    currency: 'INR',
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    status: 'ACTIVE',
    milestoneIds: ['MLS-9042-01', 'MLS-9042-02', 'MLS-9042-03'],
  },
  {
    id: 'GRNT-8810',
    grantCode: 'ICMR-MEDTECH-2024-N8810',
    title: 'Portable Graphene Neural Biosensor for Rapid Encephalitis Detection',
    granteeId: 'USR-GRANTEE-01',
    granteeName: 'Dr. Priya Sharma',
    organization: 'Indian Institute of Science (IISc)',
    totalGrantAmount: 2000000, // ₹20,00,000 INR
    disbursedAmount: 0,
    currency: 'INR',
    startDate: '2024-03-01',
    endDate: '2025-08-31',
    status: 'ACTIVE',
    milestoneIds: ['MLS-8810-01', 'MLS-8810-02'],
  }
];

export const INITIAL_GRANT: Grant = INITIAL_GRANTS[0];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'MLS-9042-01',
    grantId: 'GRNT-9042',
    milestoneNumber: 1,
    title: 'Bench-Scale Bioreactor Validation & Strain Genetic Sequencing',
    description: 'Demonstrate >85% continuous CO2 fixation rate in 200L test tank with complete genomic purity verification.',
    deliverables: [
      'Laboratory Run Logbook (200L Continuous Mode)',
      'NextSeq DNA Sequencing Results of Microalgae Strain C-74',
      'Independent Flue-Gas Spectrometry Report'
    ],
    targetDate: '2024-04-30',
    status: 'EVIDENCE_SUBMITTED',
    trancheId: 'TRN-9042-01',
    trancheAmount: 750000, // ₹7,50,000
  },
  {
    id: 'MLS-9042-02',
    grantId: 'GRNT-9042',
    milestoneNumber: 2,
    title: 'Pilot Facility 5,000L Construction & 30-Day Steady State Run',
    description: 'Erect outdoor closed-loop tubular photobioreactor and achieve 30 consecutive days of unperturbed operation.',
    deliverables: [
      'Engineering As-Built Drawings & Mechanical P&ID',
      'SCADA Automated Telemetry Log (30-day continuous)',
      'Third-party Environmental Safety & Effluent Clearance'
    ],
    targetDate: '2024-10-31',
    status: 'PENDING_EVIDENCE',
    trancheId: 'TRN-9042-02',
    trancheAmount: 1000000, // ₹10,00,000
  },
  {
    id: 'MLS-9042-03',
    grantId: 'GRNT-9042',
    milestoneNumber: 3,
    title: 'Commercial Demonstration & ISO 14064-2 Carbon Removal Audit',
    description: 'Deliver certified carbon credit issuance dossier for 1,200 metric tonnes CO2 sequestered and lifecycle analysis.',
    deliverables: [
      'ISO 14064-2 Third-Party Verification Statement (Gold Standard)',
      'Comprehensive Cradle-to-Grave Life Cycle Assessment (LCA)',
      'Commercial Offtake Agreement for Harvested Biomass'
    ],
    targetDate: '2025-05-31',
    status: 'PENDING_EVIDENCE',
    trancheId: 'TRN-9042-03',
    trancheAmount: 1250000, // ₹12,50,000
  },
  // Grant 2 Milestones
  {
    id: 'MLS-8810-01',
    grantId: 'GRNT-8810',
    milestoneNumber: 1,
    title: 'Biosensor Chip Fabrication & Sensitivity Calibration',
    description: 'Fabricate 50 microfluidic chips and validate limit of detection (LoD) at <5 picograms/mL.',
    deliverables: [
      'Cleanroom Fabrication Inspection Certificate',
      'Electrochemical Impedance Spectroscopy Calibration Curves',
      'Pre-clinical Benchmark Report'
    ],
    targetDate: '2024-06-30',
    status: 'PENDING_EVIDENCE',
    trancheId: 'TRN-8810-01',
    trancheAmount: 800000, // ₹8,00,000
  },
  {
    id: 'MLS-8810-02',
    grantId: 'GRNT-8810',
    milestoneNumber: 2,
    title: 'Hospital Clinical Trials & Regulatory Filing',
    description: 'Conduct blinded trial across 100 patient samples and file CDSCO medical device investigational clearance.',
    deliverables: [
      'Institutional Ethics Committee Sign-off',
      'Clinical Trial Results & Statistical Power Analysis',
      'CDSCO Regulatory Application Dossier'
    ],
    targetDate: '2025-02-28',
    status: 'PENDING_EVIDENCE',
    trancheId: 'TRN-8810-02',
    trancheAmount: 1200000, // ₹12,00,000
  }
];

export const INITIAL_EVIDENCE: EvidenceSubmission[] = [
  {
    id: 'EVD-9042-01',
    milestoneId: 'MLS-9042-01',
    grantId: 'GRNT-9042',
    submittedBy: 'Dr. Priya Sharma (Applicant)',
    submittedAt: '2024-04-18T14:32:00Z',
    title: 'Phase 1 Complete Deliverable Dossier & Spectrometry Metrics',
    description: 'Achieved 88.4% CO₂ capture during testing. The sample purity check was successful.',
    documentUrl: 'https://storage.cloud.gov/grants/GRNT-9042/evidence/m1_certified_report.pdf',
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    metricsAchieved: 'CO₂ Capture: 88.4% (Target: 85%) | Sample Purity: 99.8%',
    version: 1,
  }
];

export const INITIAL_TRANCHES: Tranche[] = [
  {
    id: 'TRN-9042-01',
    grantId: 'GRNT-9042',
    milestoneId: 'MLS-9042-01',
    trancheNumber: 1,
    amount: 750000, // ₹7,50,000
    currency: 'INR',
    status: 'LOCKED',
    recipientAccount: 'NEFT-SBIN0004242-IISc-RND',
  },
  {
    id: 'TRN-9042-02',
    grantId: 'GRNT-9042',
    milestoneId: 'MLS-9042-02',
    trancheNumber: 2,
    amount: 1000000, // ₹10,00,000
    currency: 'INR',
    status: 'LOCKED',
    recipientAccount: 'NEFT-SBIN0004242-IISc-RND',
  },
  {
    id: 'TRN-9042-03',
    grantId: 'GRNT-9042',
    milestoneId: 'MLS-9042-03',
    trancheNumber: 3,
    amount: 1250000, // ₹12,50,000
    currency: 'INR',
    status: 'LOCKED',
    recipientAccount: 'NEFT-SBIN0004242-IISc-RND',
  },
  // Grant 2 Tranches
  {
    id: 'TRN-8810-01',
    grantId: 'GRNT-8810',
    milestoneId: 'MLS-8810-01',
    trancheNumber: 1,
    amount: 800000, // ₹8,00,000
    currency: 'INR',
    status: 'LOCKED',
    recipientAccount: 'NEFT-HDFC0001048-MEDTECH',
  },
  {
    id: 'TRN-8810-02',
    grantId: 'GRNT-8810',
    milestoneId: 'MLS-8810-02',
    trancheNumber: 2,
    amount: 1200000, // ₹12,00,000
    currency: 'INR',
    status: 'LOCKED',
    recipientAccount: 'NEFT-HDFC0001048-MEDTECH',
  }
];

export const INITIAL_SERVICE_INSTANCES: ServiceInstance[] = [
  {
    instanceId: 'eureka-server-01',
    serviceName: 'EUREKA-SERVER',
    host: 'eureka-registry',
    port: 8761,
    status: 'UP',
    zone: 'ap-south-1a',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 1420,
  },
  {
    instanceId: 'api-gateway-01',
    serviceName: 'API-GATEWAY',
    host: 'api-gateway',
    port: 8080,
    status: 'UP',
    zone: 'ap-south-1a',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 894,
  },
  {
    instanceId: 'auth-service-01',
    serviceName: 'AUTH-SERVICE',
    host: 'auth-service',
    port: 8081,
    status: 'UP',
    zone: 'ap-south-1a',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 345,
  },
  {
    instanceId: 'grant-service-01',
    serviceName: 'GRANT-SERVICE',
    host: 'grant-service',
    port: 8082,
    status: 'UP',
    zone: 'ap-south-1b',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 260,
  },
  {
    instanceId: 'milestone-review-service-01',
    serviceName: 'MILESTONE-REVIEW-SERVICE',
    host: 'review-service',
    port: 8085,
    status: 'UP',
    zone: 'ap-south-1a',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 198,
  },
  {
    instanceId: 'tranche-service-inst1',
    serviceName: 'TRANCHE-SERVICE',
    host: 'tranche-service-1',
    port: 8083,
    status: 'UP',
    zone: 'ap-south-1a',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 124,
  },
  {
    instanceId: 'tranche-service-inst2',
    serviceName: 'TRANCHE-SERVICE',
    host: 'tranche-service-2',
    port: 8084,
    status: 'UP',
    zone: 'ap-south-1b',
    lastHeartbeat: new Date().toISOString(),
    totalRequestsHandled: 119,
  },
];

export const INITIAL_TEST_CASES: TestCaseResult[] = [
  {
    id: 'TEST-01',
    name: 'assertMilestoneApprovalReleasesOnlyAssociatedTranche',
    type: 'JUnit5_AssertJ',
    coTarget: 'CO4',
    description: 'Domain rule: When Milestone 1 is approved, only Tranche 1 (₹7,50,000) is released; Tranches 2 and 3 remain LOCKED.',
    status: 'PASSED',
    durationMs: 42,
    details: 'Asserted that trancheRepository.findById("TRN-9042-01").getStatus() == DISBURSED (₹7,50,000) and TRN-9042-02 remains LOCKED.',
    codeSnippet: `@Test
@DisplayName("Approve milestone releases only associated tranche in INR")
void shouldReleaseOnlyAssociatedTrancheOnApproval() {
    MilestoneId m1 = MilestoneId.of("MLS-9042-01");
    MilestoneId m2 = MilestoneId.of("MLS-9042-02");
    
    trancheWorkflowService.handleMilestoneApproved(new MilestoneApprovedEvent(m1, Amount.of(750000, Currency.INR)));

    Tranche t1 = trancheRepository.findByMilestoneId(m1).orElseThrow();
    Tranche t2 = trancheRepository.findByMilestoneId(m2).orElseThrow();
    
    assertThat(t1.getStatus()).isEqualTo(TrancheStatus.DISBURSED);
    assertThat(t1.getDisbursedAmount()).isEqualByComparingTo(BigDecimal.valueOf(750000));
    assertThat(t2.getStatus()).isEqualTo(TrancheStatus.LOCKED);
}`
  },
  {
    id: 'TEST-02',
    name: 'assertIdempotentEventDeliverySingleBusinessEffect',
    type: 'JUnit5_AssertJ',
    coTarget: 'CO1',
    description: 'Event reliability (B2): Delivering the same MilestoneApproved event twice results in exactly ONE ledger disbursement entry.',
    status: 'PASSED',
    durationMs: 38,
    details: 'Verified consumed_events table de-duplication: duplicate eventId ignored, disbursement count = 1.',
    codeSnippet: `@Test
void shouldIgnoreDuplicateEventDeliveryWithoutDoubleDisbursement() {
    MilestoneApprovedEvent event = createSampleApprovalEvent();
    
    trancheKafkaConsumer.consume(event);
    trancheKafkaConsumer.consume(event); // Duplicate delivery
    
    List<DisbursementRecord> disbursements = ledgerRepo.findAllByTrancheId(event.getTrancheId());
    assertThat(disbursements).hasSize(1);
    assertThat(consumedEventRepo.existsById(event.getEventId())).isTrue();
}`
  },
  {
    id: 'TEST-03',
    name: 'verifyGatewayAuthenticatedWorkflowAndStateUpdate',
    type: 'SpringBootTest',
    coTarget: 'CO3',
    description: 'Integration test: Route evidence submission and review approval through Spring Cloud Gateway with JWT.',
    status: 'PASSED',
    durationMs: 185,
    details: 'MockMvc calls through Gateway with Bearer JWT returned 200 OK and updated downstream domain state.',
    codeSnippet: `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EmbeddedKafka(topics = {"soa.s08.t03.events"})
class GatewayWorkflowIntegrationTest {
    @Test
    void testEndToEndWorkflowThroughGateway() {
        webTestClient.post().uri("/api/v1/reviews/approve")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + reviewerJwt)
            .bodyValue(new ApprovalRequest("MLS-9042-01", "Approved!"))
            .exchange()
            .expectStatus().isOk();

        await().atMost(5, SECONDS).untilAsserted(() -> {
            Tranche t = trancheClient.getTranche("TRN-9042-01");
            assertThat(t.getStatus()).isEqualTo(TrancheStatus.DISBURSED);
        });
    }
}`
  },
  {
    id: 'TEST-04',
    name: 'assertGranteeDeniedReviewerEndpointWith403Forbidden',
    type: 'SpringBootTest',
    coTarget: 'CO2',
    description: 'Security test: Grantee role attempting to approve a milestone receives HTTP 403 Forbidden.',
    status: 'PASSED',
    durationMs: 29,
    details: 'Spring Security method security @PreAuthorize("hasRole(\'grantReviewer\')") intercepted call and returned 403.',
    codeSnippet: `@Test
void shouldDenyGranteeApprovalWithForbidden() {
    webTestClient.post().uri("/api/v1/reviews/approve")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + granteeJwt)
        .bodyValue(new ApprovalRequest("MLS-9042-01", "Unauthorized!"))
        .exchange()
        .expectStatus().isForbidden();
}`
  },
  {
    id: 'TEST-05',
    name: 'assertPersistenceConstraintsAndIsolatedStores',
    type: 'DataJpaTest',
    coTarget: 'CO3',
    description: 'DataJpaTest: Verifies unique constraints on consumed_events(event_id) and strict per-service schema boundaries.',
    status: 'PASSED',
    durationMs: 47,
    details: 'DataIntegrityViolationException thrown when attempting to insert duplicate eventId into consumed_events table.',
    codeSnippet: `@DataJpaTest
class TranchePersistenceConstraintsTest {
    @Test
    void shouldEnforceUniqueEventIdConstraint() {
        ConsumedEvent e1 = new ConsumedEvent(UUID.randomUUID(), "MLS-01");
        consumedEventRepository.saveAndFlush(e1);

        assertThatThrownBy(() -> {
            ConsumedEvent e2 = new ConsumedEvent(e1.getEventId(), "MLS-01");
            consumedEventRepository.saveAndFlush(e2);
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}`
  },
  {
    id: 'TEST-06',
    name: 'verifyMilestoneApprovedKafkaEventContract',
    type: 'Contract_Pact',
    coTarget: 'CO1',
    description: 'Spring Cloud Contract: Asserts MilestoneApproved event contains all required schema fields.',
    status: 'PASSED',
    durationMs: 34,
    details: 'Contract schema matched producer expectation. Payload matches JSON Schema Draft 7.',
    codeSnippet: `Contract.make {
    label 'milestone_approved_event'
    input { triggeredBy('publishMilestoneApproved()') }
    outputMessage {
        sentTo('soa.s08.t03.events')
        body([
            eventId: anyUuid(),
            aggregateId: regex('MLS-[0-9]{4}-[0-9]{2}'),
            schemaVersion: '1.0.0',
            occurredAt: anyIso8601(),
            correlationId: anyUuid(),
            payload: [
                trancheId: regex('TRN-[0-9]{4}-[0-9]{2}'),
                approvedAmount: anyPositiveNumber()
            ]
        ])
    }
}`
  }
];
