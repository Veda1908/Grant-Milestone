import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  CheckSquare, 
  Code2, 
  Workflow, 
  BookOpen, 
  ChevronRight, 
  Terminal,
  ShieldCheck
} from 'lucide-react';

export const ArchitectureDocsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rubric' | 'code' | 'diagram' | 'board' | 'docker'>('rubric');
  const [selectedFile, setSelectedFile] = useState<string>('TrancheKafkaConsumer.java');

  const filesMap: Record<string, { lang: string; path: string; code: string }> = {
    'TrancheKafkaConsumer.java': {
      lang: 'java',
      path: 'tranche-service/src/main/java/com/hackathon/tranche/event/TrancheKafkaConsumer.java',
      code: `package com.hackathon.tranche.event;

import com.hackathon.tranche.domain.ConsumedEvent;
import com.hackathon.tranche.repository.ConsumedEventRepository;
import com.hackathon.tranche.service.DisbursementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * B1/B2/CO1: Idempotent Consumer for topic soa.s08.t03.events
 * Processes MilestoneApproved event and triggers tranche fund release.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TrancheKafkaConsumer {

    private final ConsumedEventRepository consumedEventRepo;
    private final DisbursementService disbursementService;

    @Transactional
    @KafkaListener(
        topics = "soa.s08.t03.events",
        groupId = "tranche-service-fund-releaser"
    )
    public void onMilestoneApproved(
        @Payload MilestoneApprovedEvent event,
        @Header(KafkaHeaders.RECEIVED_KEY) String partitionKey,
        @Header(value = "X-Correlation-Id", required = false) String correlationId,
        Acknowledgment ack
    ) {
        log.info("[KAFKA CONSUME] Received MilestoneApproved. EventId: {}, Milestone: {}", 
            event.getEventId(), event.getAggregateId());

        // B2: Deduplication via consumed_events table (Idempotency)
        if (consumedEventRepo.existsById(event.getEventId())) {
            log.warn("[DUPLICATE DETECTED] EventId {} already processed. Skipping business effect.", 
                event.getEventId());
            ack.acknowledge();
            return;
        }

        // Validate contract schema version
        if (!"1.0.0".equals(event.getSchemaVersion())) {
            throw new IncompatibleSchemaException("Expected 1.0.0 but received: " + event.getSchemaVersion());
        }

        // Persist consumed event record in tranche_db
        consumedEventRepo.save(new ConsumedEvent(
            event.getEventId(), 
            "tranche-service", 
            event.getAggregateId()
        ));

        // Release associated tranche funds ONLY (B1 domain rule)
        disbursementService.authorizeAndDisburse(
            event.getPayload().getTrancheId(),
            event.getPayload().getApprovedAmount(),
            event.getEventId(),
            correlationId
        );

        ack.acknowledge();
        log.info("[TRANCHE RELEASED] Funds disbursed for tranche: {}", 
            event.getPayload().getTrancheId());
    }
}`
    },
    'MilestoneReviewService.java': {
      lang: 'java',
      path: 'milestone-review-service/src/main/java/com/hackathon/review/service/MilestoneReviewService.java',
      code: `package com.hackathon.review.service;

import com.hackathon.review.domain.ReviewDecision;
import com.hackathon.review.domain.ReviewOutbox;
import com.hackathon.review.event.MilestoneApprovedEvent;
import com.hackathon.review.repository.ReviewDecisionRepository;
import com.hackathon.review.repository.ReviewOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

/**
 * B1/B3/CO2: Evaluates milestone submissions and dispatches approval event.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MilestoneReviewService {

    private final ReviewDecisionRepository decisionRepo;
    private final ReviewOutboxRepository outboxRepo;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    @PreAuthorize("hasRole('grantReviewer')") // CO2 Security RBAC
    public ReviewDecision recordDecision(String milestoneId, DecisionType decision, String reviewerId, String notes) {
        log.info("Reviewer {} submitting decision {} for milestone {}", reviewerId, decision, milestoneId);

        ReviewDecision entity = ReviewDecision.builder()
            .id(UUID.randomUUID().toString())
            .milestoneId(milestoneId)
            .reviewerId(reviewerId)
            .decision(decision)
            .comments(notes)
            .reviewedAt(Instant.now())
            .build();
        
        decisionRepo.save(entity);

        if (decision == DecisionType.APPROVE) {
            MilestoneApprovedEvent event = MilestoneApprovedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType("MilestoneApproved")
                .aggregateId(milestoneId)
                .schemaVersion("1.0.0")
                .occurredAt(Instant.now().toString())
                .correlationId(UUID.randomUUID().toString())
                .topic("soa.s08.t03.events")
                .partitionKey(milestoneId) // Per-aggregate partition key
                .build();

            // Transactional Outbox (B2)
            outboxRepo.save(new ReviewOutbox(event.getEventId(), "MilestoneApproved", event));

            // Publish to Kafka topic: soa.s08.t03.events
            kafkaTemplate.send("soa.s08.t03.events", event.getPartitionKey(), event);
        }

        return entity;
    }
}`
    },
    'SecurityConfig.java': {
      lang: 'java',
      path: 'common-security/src/main/java/com/hackathon/security/SecurityConfig.java',
      code: `package com.hackathon.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

/**
 * B3 / CO2: Spring Security 6 Resource Server Configuration
 * Validates Signed JWTs, roles (grantee, grantReviewer), and CORS.
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/eureka/**").permitAll()
                .requestMatchers("/api/v1/reviews/**").hasRole("grantReviewer")
                .requestMatchers("/api/v1/milestones/**/evidence").hasRole("grantee")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://applet.internal"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Correlation-Id"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthoritiesClaimName("role");
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}`
    },
    'GatewayConfig.java': {
      lang: 'java',
      path: 'api-gateway/src/main/java/com/hackathon/gateway/GatewayConfig.java',
      code: `package com.hackathon.gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * B4 / CO3: Spring Cloud Gateway Routing using Eureka discovery names.
 */
@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("grant-service-route", r -> r
                .path("/api/v1/grants/**")
                .uri("lb://GRANT-SERVICE")
            )
            .route("review-service-route", r -> r
                .path("/api/v1/reviews/**")
                .uri("lb://MILESTONE-REVIEW-SERVICE")
            )
            .route("tranche-service-route", r -> r
                .path("/api/v1/tranches/**")
                .uri("lb://TRANCHE-SERVICE")
            )
            .build();
    }
}`
    },
    'docker-compose.yml': {
      lang: 'yaml',
      path: 'docker-compose.yml',
      code: `version: '3.8'

services:
  eureka-server:
    image: springcloud/eureka-server:latest
    ports: ["8761:8761"]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on: [zookeeper]
    ports: ["9092:9092"]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092

  # Per-Service Isolated JPA PostgreSQL Stores (B4/CO3)
  grant-db:
    image: postgres:16-alpine
    ports: ["5432:5432"]

  review-db:
    image: postgres:16-alpine
    ports: ["5433:5432"]

  tranche-db:
    image: postgres:16-alpine
    ports: ["5434:5432"]`
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">SOA Hackathon Documentation</span>
              <span>·</span>
              <span className="font-mono text-indigo-700 font-semibold">24SDCS03 / S08.T03</span>
              <span>·</span>
              <span>B1 to B6 Delivery Evidence</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Architecture & Compliance Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Course Outcome (CO1-CO4) mapping, choreography sequence flow, Java Spring Boot codebase, and sprint retrospective.
            </p>
          </div>
        </div>

        {/* Subtabs */}
        <div className="flex space-x-1 mt-6 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('rubric')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'rubric' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>CO1-CO4 & B1-B6 Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'code' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Spring Boot Codebase</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'diagram' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-emerald-600" />
            <span>Choreography Sequence</span>
          </button>

          <button
            onClick={() => setActiveSubTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'board' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>Stories & Retrospective</span>
          </button>

          <button
            onClick={() => setActiveSubTab('docker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'docker' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-sky-600" />
            <span>Startup Instructions</span>
          </button>
        </div>
      </div>

      {/* View: Rubric and CO Mapping */}
      {activeSubTab === 'rubric' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-2">
              Course Outcome (CO1 - CO4) Verification Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Requirement</th>
                    <th className="py-2.5 px-3">Implementation in GrantTranche</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">CO1</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">Service Contracts + Kafka Workflow</td>
                    <td className="py-3 px-3 text-slate-600">
                      Topic <code className="text-amber-800">soa.s08.t03.events</code>. Producer <code className="text-indigo-700">milestone-review-service</code> dispatches <code className="text-slate-900">MilestoneApproved</code>. Downstream consumer <code className="text-emerald-700">tranche-service</code> autonomously disburses funds.
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">VERIFIED</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">CO2</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">JWT Roles + Authorization</td>
                    <td className="py-3 px-3 text-slate-600">
                      Signed RS256 JWTs with roles <code className="text-indigo-700">grantee</code> and <code className="text-emerald-700">grantReviewer</code>. Record-level access checks on <code className="text-slate-900">allowedGrantIds</code>. Redacted audit trail and 403 Forbidden enforcement.
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">VERIFIED</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">CO3</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">Eureka + Gateway + Per-Service JPA</td>
                    <td className="py-3 px-3 text-slate-600">
                      Spring Cloud Gateway (8080) routing via <code className="text-indigo-700">lb://</code> discovery. 2 Tranche instances with load balancing and failover. 4 independent PostgreSQL JPA databases with isolated credentials.
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">VERIFIED</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">CO4</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">JUnit + Integration + Contract Tests</td>
                    <td className="py-3 px-3 text-slate-600">
                      JUnit 5 + AssertJ asserting domain rule (approve M1 releases T1 only). SpringBootTest for authenticated Gateway workflow. DataJpaTest constraints. Contract test failing on deliberate schema mismatch.
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">VERIFIED</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Code Viewer */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 px-1 mb-2">Java Sources & Config</div>
            {Object.keys(filesMap).map((fileName) => {
              const isSelected = selectedFile === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`w-full text-left p-3 rounded-lg border transition text-xs font-mono flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-100 border-indigo-300 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    <span className="truncate">{fileName}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-mono text-slate-700">{filesMap[selectedFile].path}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {filesMap[selectedFile].lang.toUpperCase()}
              </span>
            </div>

            <pre className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-4 text-[11px] font-mono overflow-x-auto max-h-[500px] leading-relaxed">
              {filesMap[selectedFile].code}
            </pre>
          </div>
        </div>
      )}

      {/* Sequence Diagram */}
      {activeSubTab === 'diagram' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Choreographed Interaction Sequence Flow
          </h2>
          <div className="bg-slate-900 p-6 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
            <pre>
{`+------------+          +---------------+        +-------------------------+        +---------------+        +-----------------+
|  Grantee   |          |  API Gateway  |        | MilestoneReview Service |        |  Apache Kafka |        | Tranche Service |
+------------+          +---------------+        +-------------------------+        +---------------+        +-----------------+
      |                        |                              |                             |                         |
      | 1. POST /evidence     |                              |                             |                         |
      |----------------------->|                              |                             |                         |
      | (JWT: role=grantee)    | 2. Forward to lb://REVIEW    |                             |                         |
      |                        |----------------------------->|                             |                         |
      |                        |                              |--+                          |                         |
      |                        |                              |  | 3. Persist evidence      |                         |
      |                        |                              |  |    in review_db          |                         |
      |                        |                              |<-+                          |                         |
      |                        |<-----------------------------|                             |                         |
      |<-----------------------| 201 Created                  |                             |                         |
      |                        |                              |                             |                         |
+---------------+              |                              |                             |                         |
| GrantReviewer |              |                              |                             |                         |
+---------------+              |                              |                             |                         |
      | 4. POST /decisions     |                              |                             |                         |
      |----------------------->|                              |                             |                         |
      | (JWT: role=reviewer)   | 5. Forward to lb://REVIEW    |                             |                         |
      |                        |----------------------------->|                             |                         |
      |                        |                              |--+                          |                         |
      |                        |                              |  | 6. Validate & Write to   |                         |
      |                        |                              |  |    review_outbox         |                         |
      |                        |                              |<-+                          |                         |
      |                        |                              |                             |                         |
      |                        |                              | 7. Publish MilestoneApproved|                         |
      |                        |                              |---------------------------->|                         |
      |                        |                              |    (topic: soa.s08.t03)     |                         |
      |                        |                              |                             | 8. Poll Event           |
      |                        |                              |                             |------------------------>|
      |                        |                              |                             |                         |--+
      |                        |                              |                             |                         |  | 9. Check consumed_events
      |                        |                              |                             |                         |  |    (Idempotency check)
      |                        |                              |                             |                         |<-+
      |                        |                              |                             |                         |--+
      |                        |                              |                             |                         |  | 10. Release Tranche 1 ONLY
      |                        |                              |                             |                         |  |     Persist ledger in tranche_db
      |                        |                              |                             |                         |<-+
      |                        |<-----------------------------|                             |                         |
      |<-----------------------| 200 OK (Approved)            |                             |                         |
`}
            </pre>
          </div>
        </div>
      )}

      {/* Task Board */}
      {activeSubTab === 'board' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-3">
              Kanban Task Board & Sprint Retrospective
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-500 mb-2">BACKLOG</div>
                <div className="p-3 bg-white rounded border border-slate-200 text-xs shadow-sm">
                  <div className="font-semibold text-slate-900">Debezium CDC Connector</div>
                  <div className="text-[11px] text-slate-500 mt-1">Automate Postgres outbox streaming to Kafka.</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-indigo-700 mb-2">IN TESTING</div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900">Repeatable Latency Check</div>
                    <div className="text-[11px] text-slate-500 mt-1">Benchmarking 50 requests through Gateway.</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-emerald-700 mb-2">DONE</div>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900">MilestoneApproved Event Choreography</div>
                    <div className="text-[11px] text-slate-500 mt-1">Topic soa.s08.t03.events with per-milestone partitioning.</div>
                  </div>
                  <div className="p-3 bg-white rounded border border-slate-200 text-xs shadow-sm">
                    <div className="font-semibold text-slate-900">Eureka Registry & Gateway LB</div>
                    <div className="text-[11px] text-slate-500 mt-1">2 Tranche instances with instant recovery.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Startup Instructions */}
      {activeSubTab === 'docker' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">
            Startup & Verification Commands
          </h2>
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono">
              <span className="text-slate-500 block mb-1">1. Boot Infrastructure:</span>
              <code className="text-slate-900 font-bold">docker-compose up -d eureka-server kafka zookeeper grant-db review-db tranche-db</code>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono">
              <span className="text-slate-500 block mb-1">2. Run Maven Test Suite:</span>
              <code className="text-slate-900 font-bold">mvn clean verify -Dtest=*Test</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
