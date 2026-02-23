# Database Schema Design
## 데이터베이스 스키마 설계서

**프로젝트**: AI-Native Speaker Management Pilot System
**문서 버전**: v1.0
**작성일**: 2026-02-16
**작성자**: Garambada

---

## 1. 개요

### 1.1 목적
AI-Native Speaker Management System의 데이터 모델 정의 및 데이터베이스 구조 설계

### 1.2 데이터베이스 아키텍처

```
┌─────────────────────────────────────┐
│      Application Layer              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      PostgreSQL (Main DB)           │
│  - 사용자, 스피커, 일정, 거래        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Qdrant (Vector DB)             │
│  - 콘텐츠 임베딩, 지식 검색          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Neo4j (Knowledge Graph)        │
│  - 전문가 관계, 개념 연결            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Redis (Cache & Session)        │
│  - 세션, 캐시, 실시간 데이터         │
└─────────────────────────────────────┘
```

---

## 2. PostgreSQL 스키마

### 2.1 ERD (Entity Relationship Diagram)

```
┌──────────────┐         ┌──────────────┐
│   Users      │         │   Speakers   │
│──────────────│         │──────────────│
│ PK user_id   │         │ PK speaker_id│
│    email     │         │    name      │
│    role      │         │    bio       │
│    tier      │         │    expertise │
└──────────────┘         └──────────────┘
       │                        │
       │                        │
       │    ┌──────────────┐   │
       └───→│  Bookings    │←──┘
            │──────────────│
            │ PK booking_id│
            │ FK user_id   │
            │ FK speaker_id│
            │    datetime  │
            └──────────────┘
                   │
                   │
            ┌──────────────┐
            │  Payments    │
            │──────────────│
            │ PK payment_id│
            │ FK booking_id│
            │    amount    │
            │    status    │
            └──────────────┘

┌──────────────┐         ┌──────────────┐
│  Contents    │         │  Embeddings  │
│──────────────│         │──────────────│
│ PK content_id│────────→│ PK embed_id  │
│ FK speaker_id│         │ FK content_id│
│    type      │         │    vector_id │
│    text      │         │    metadata  │
└──────────────┘         └──────────────┘

┌──────────────┐
│ Conversations│
│──────────────│
│ PK conv_id   │
│ FK user_id   │
│    context   │
│    history   │
└──────────────┘
```

### 2.2 테이블 정의

#### (1) Users - 사용자 정보

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('executive', 'admin', 'guest')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver', 'trial')),
    company VARCHAR(100),
    industry VARCHAR(50),
    position VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_role ON users(role);
```

**필드 설명**:
- `preferences`: 개인화 설정 (관심사, 알림 설정 등)
- `tier`: The Boardroom Club 멤버십 등급
- `role`: 시스템 권한 레벨

#### (2) Speakers - 전문가 정보

```sql
CREATE TABLE speakers (
    speaker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    bio TEXT,
    profile_image_url TEXT,
    expertise JSONB DEFAULT '[]',
    speaking_style JSONB DEFAULT '{}',
    core_beliefs JSONB DEFAULT '[]',
    key_phrases JSONB DEFAULT '[]',
    hourly_rate_tier1 DECIMAL(10, 2),
    hourly_rate_tier2 DECIMAL(10, 2),
    hourly_rate_tier3 DECIMAL(10, 2),
    availability_schedule JSONB DEFAULT '{}',
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_speakers_slug ON speakers(slug);
CREATE INDEX idx_speakers_active ON speakers(is_active);
```

**필드 설명**:
- `expertise`: ["AI", "클라우드", "전략"] 형태의 배열
- `speaking_style`: ID-RAG를 위한 말투 특징 JSON
- `hourly_rate_tier1/2/3`: 멤버십 등급별 시간당 요금

#### (3) Contents - 전문가 콘텐츠

```sql
CREATE TABLE contents (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID NOT NULL REFERENCES speakers(speaker_id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('book', 'article', 'speech', 'interview', 'video')),
    title VARCHAR(500) NOT NULL,
    original_text TEXT NOT NULL,
    processed_text TEXT,
    url TEXT,
    published_date DATE,
    keywords JSONB DEFAULT '[]',
    topic VARCHAR(100),
    importance_score DECIMAL(3, 2),
    chunk_count INTEGER DEFAULT 0,
    indexed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contents_speaker ON contents(speaker_id);
CREATE INDEX idx_contents_type ON contents(source_type);
CREATE INDEX idx_contents_date ON contents(published_date);
CREATE INDEX idx_contents_topic ON contents(topic);
```

#### (4) Content_Chunks - 콘텐츠 청크

```sql
CREATE TABLE content_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES contents(content_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    token_count INTEGER,
    vector_id VARCHAR(100),  -- Qdrant의 벡터 ID 참조
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chunks_content ON content_chunks(content_id);
CREATE INDEX idx_chunks_vector ON content_chunks(vector_id);
CREATE UNIQUE INDEX idx_chunks_content_index ON content_chunks(content_id, chunk_index);
```

#### (5) Bookings - 자문 예약

```sql
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(speaker_id) ON DELETE CASCADE,
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('video', 'phone', 'in-person', 'pre-advisory')),
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
    meeting_url TEXT,
    agenda TEXT,
    pre_advisory_report_id UUID,
    notes TEXT,
    recording_url TEXT,
    transcript TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_speaker ON bookings(speaker_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_start);
```

#### (6) Payments - 결제 정보

```sql
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(booking_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(20) CHECK (payment_method IN ('credit_card', 'bank_transfer', 'subscription')),
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255) UNIQUE,
    payment_provider VARCHAR(50),
    invoice_url TEXT,
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
```

#### (7) Subscriptions - 구독 정보

```sql
CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('platinum', 'gold', 'silver')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
    monthly_fee DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
```

#### (8) Conversations - 대화 이력

```sql
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(speaker_id) ON DELETE SET NULL,
    agent_type VARCHAR(50),  -- 'briefing', 'advisory', 'concierge'
    context JSONB DEFAULT '{}',
    summary TEXT,
    total_messages INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_speaker ON conversations(speaker_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_type);
```

#### (9) Messages - 대화 메시지

```sql
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

#### (10) Pre_Advisory_Reports - 사전 자문 보고서

```sql
CREATE TABLE pre_advisory_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    speaker_id UUID NOT NULL REFERENCES speakers(speaker_id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    analysis JSONB NOT NULL,
    options JSONB NOT NULL,
    recommendation TEXT,
    confidence_score DECIMAL(3, 2),
    sources JSONB DEFAULT '[]',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    viewed_at TIMESTAMP,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_text TEXT
);

CREATE INDEX idx_reports_user ON pre_advisory_reports(user_id);
CREATE INDEX idx_reports_speaker ON pre_advisory_reports(speaker_id);
CREATE INDEX idx_reports_generated ON pre_advisory_reports(generated_at);
```

#### (11) Notifications - 알림

```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent ON notifications(sent_at);
```

#### (12) Audit_Logs - 감사 로그

```sql
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    changes JSONB,
    status VARCHAR(20) CHECK (status IN ('success', 'failure')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## 3. Qdrant Vector DB 스키마

### 3.1 컬렉션: speaker_knowledge

```python
# Collection Configuration
collection_config = {
    "name": "speaker_knowledge",
    "vectors": {
        "size": 3072,  # text-embedding-3-large
        "distance": "Cosine"
    },
    "payload_schema": {
        "content_id": "uuid",
        "chunk_id": "uuid",
        "speaker_id": "uuid",
        "speaker_name": "keyword",
        "source_type": "keyword",
        "source_title": "text",
        "chunk_text": "text",
        "published_date": "datetime",
        "keywords": "keyword[]",
        "topic": "keyword",
        "importance_score": "float"
    }
}
```

### 3.2 인덱싱 예시

```python
# Vector Point 예시
point = {
    "id": "vec_001",
    "vector": [0.123, 0.456, ...],  # 3072 dimensions
    "payload": {
        "content_id": "content_001",
        "chunk_id": "chunk_001",
        "speaker_id": "speaker_001",
        "speaker_name": "박태웅",
        "source_type": "book",
        "source_title": "AI 시대의 문해력",
        "chunk_text": "AI 시대에는 올바른 질문을 던지는 능력이...",
        "published_date": "2025-06-15",
        "keywords": ["AI", "문해력", "교육"],
        "topic": "AI 교육",
        "importance_score": 0.85
    }
}
```

---

## 4. Neo4j Knowledge Graph 스키마

### 4.1 노드 타입

```cypher
// Expert Node
(:Expert {
    speaker_id: UUID,
    name: String,
    bio: String,
    expertise: [String]
})

// Concept Node
(:Concept {
    concept_id: UUID,
    name: String,
    definition: String,
    category: String
})

// Topic Node
(:Topic {
    topic_id: UUID,
    name: String,
    category: String,
    description: String
})

// Document Node
(:Document {
    content_id: UUID,
    title: String,
    source_type: String,
    published_date: Date
})

// User Node (경영진)
(:User {
    user_id: UUID,
    name: String,
    role: String,
    interests: [String]
})
```

### 4.2 관계 타입

```cypher
// 전문가 → 개념
(:Expert)-[:BELIEVES_IN {confidence: Float}]->(:Concept)
(:Expert)-[:ADVOCATES_FOR {strength: Float}]->(:Concept)

// 전문가 → 주제
(:Expert)-[:SPEAKS_ABOUT {frequency: Int}]->(:Topic)
(:Expert)-[:EXPERT_IN {level: String}]->(:Topic)

// 전문가 → 문서
(:Expert)-[:AUTHORED]->(:Document)

// 개념 간 관계
(:Concept)-[:RELATED_TO {weight: Float}]->(:Concept)
(:Concept)-[:OPPOSES]->(:Concept)
(:Concept)-[:EXTENDS]->(:Concept)

// 주제 → 개념
(:Topic)-[:INCLUDES]->(:Concept)

// 사용자 → 주제
(:User)-[:INTERESTED_IN {priority: Int}]->(:Topic)
```

### 4.3 쿼리 예시

```cypher
// 박태웅 위원의 AI 교육 관련 신념 검색
MATCH (e:Expert {name: "박태웅"})-[:BELIEVES_IN]->(c:Concept)
      <-[:INCLUDES]-(t:Topic {name: "AI 교육"})
RETURN c.name, c.definition

// 특정 개념과 관련된 모든 전문가 찾기
MATCH (e:Expert)-[r:BELIEVES_IN|ADVOCATES_FOR]->(c:Concept {name: "AI 윤리"})
RETURN e.name, type(r), r.confidence
ORDER BY r.confidence DESC

// 경영진 관심사 기반 추천 전문가
MATCH (u:User {user_id: $user_id})-[:INTERESTED_IN]->(t:Topic)
      <-[:EXPERT_IN]-(e:Expert)
RETURN e.name, e.bio, count(t) as relevance_score
ORDER BY relevance_score DESC
LIMIT 5
```

---

## 5. Redis 캐시 스키마

### 5.1 키 네이밍 규칙

```
session:{session_id}                    # 사용자 세션
cache:query:{query_hash}                # 쿼리 결과 캐시
cache:embedding:{text_hash}             # 임베딩 캐시
rate_limit:user:{user_id}               # Rate Limiting
briefing:user:{user_id}:{date}          # 일일 브리핑
conversation:context:{conversation_id}   # 대화 컨텍스트
notification:queue:{user_id}            # 알림 큐
```

### 5.2 데이터 구조 예시

```python
# Session (Hash)
redis.hset("session:abc123", mapping={
    "user_id": "user_001",
    "email": "ceo@company.com",
    "role": "executive",
    "tier": "platinum",
    "expires_at": "2026-02-17T10:00:00"
})

# Query Cache (String with TTL)
redis.setex(
    "cache:query:hash_xyz",
    3600,  # 1 hour TTL
    json.dumps({"result": "...", "cached_at": "..."})
)

# Rate Limit (Sorted Set)
redis.zadd(
    "rate_limit:user:user_001",
    {f"request_{timestamp}": timestamp}
)

# Conversation Context (List)
redis.lpush(
    "conversation:context:conv_001",
    json.dumps({"role": "user", "content": "..."})
)
```

---

## 6. 데이터 무결성 규칙

### 6.1 제약 조건

1. **참조 무결성**
   - 모든 Foreign Key는 ON DELETE CASCADE 또는 SET NULL
   - Orphan 레코드 방지

2. **도메인 무결성**
   - CHECK 제약으로 유효한 값만 허용
   - ENUM 타입 활용 (status, role, tier 등)

3. **엔티티 무결성**
   - 모든 테이블에 UUID 기반 Primary Key
   - UNIQUE 제약 (email, slug, transaction_id 등)

### 6.2 트리거

```sql
-- Updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (다른 테이블에도 동일하게 적용)
```

---

## 7. 인덱싱 전략

### 7.1 성능 최적화 인덱스

```sql
-- 복합 인덱스
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_speaker_scheduled ON bookings(speaker_id, scheduled_start);
CREATE INDEX idx_contents_speaker_date ON contents(speaker_id, published_date);

-- 부분 인덱스
CREATE INDEX idx_active_bookings ON bookings(scheduled_start)
    WHERE status IN ('pending', 'confirmed');

-- GIN 인덱스 (JSONB)
CREATE INDEX idx_users_preferences ON users USING GIN(preferences);
CREATE INDEX idx_speakers_expertise ON speakers USING GIN(expertise);
```

### 7.2 Full-Text Search

```sql
-- 콘텐츠 전문 검색
ALTER TABLE contents ADD COLUMN search_vector tsvector;

CREATE INDEX idx_contents_search ON contents USING GIN(search_vector);

CREATE TRIGGER tsvector_update BEFORE INSERT OR UPDATE
ON contents FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.korean', title, processed_text);
```

---

## 8. 백업 및 복구 전략

### 8.1 PostgreSQL

- **전체 백업**: 매일 새벽 2시 pg_dump
- **증분 백업**: WAL 아카이빙 (Point-in-Time Recovery 지원)
- **보관 기간**: 30일
- **복구 테스트**: 주 1회

### 8.2 Qdrant

- **스냅샷**: 매일 자동 스냅샷 생성
- **클라우드 저장**: S3/GCS에 백업

### 8.3 Neo4j

- **백업**: 매일 neo4j-admin backup
- **Export**: 주 1회 Cypher 스크립트 내보내기

---

## 9. 데이터 마이그레이션 계획

### Phase 1: 초기 데이터 로드
```sql
-- 전문가 데이터 삽입
INSERT INTO speakers (name, slug, bio, expertise) VALUES
    ('박태웅', 'park-taewung', '한빛미디어 이사회 의장...', '["AI", "문해력", "교육"]'),
    ('한상기', 'han-sangki', '한국벤처투자 대표...', '["벤처", "투자", "스타트업"]'),
    ('윤대균', 'yoon-daegyun', 'AI 정책 전문가...', '["AI 정책", "규제", "윤리"]');
```

### Phase 2: 콘텐츠 인덱싱
- 저서, 기고문, 강연 자료 수집
- 전처리 및 청킹
- Vector DB 임베딩

### Phase 3: Knowledge Graph 구축
- 개념 추출 및 노드 생성
- 관계 매핑

---

## 10. 모니터링 지표

| 지표 | 목표 | 알림 조건 |
|-----|------|-----------|
| DB Connection Pool | < 80% | > 90% |
| Query Response Time (P95) | < 100ms | > 500ms |
| Vector Search Latency | < 200ms | > 1s |
| Cache Hit Rate | > 80% | < 60% |
| Dead Tuples | < 10% | > 20% |

---

**문서 ID**: ARCH-DB-2026-001
**작성자**: Garambada | skangbada@gmail.com
