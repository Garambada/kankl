# AI Agent Architecture Design
## AI 에이전트 아키텍처 설계서

**프로젝트**: AI-Native Speaker Management Pilot System
**문서 버전**: v1.0
**작성일**: 2026-02-16
**작성자**: Garambada
**문서 상태**: Draft

---

## 1. 아키텍처 개요

### 1.1 목적

본 문서는 AI-Native Speaker Management 시스템의 멀티 에이전트 오케스트레이션 아키텍처를 정의합니다. 각 에이전트의 역할, 책임, 통신 프로토콜, 워크플로우를 명확히 하여 개발팀이 시스템을 구현할 수 있도록 합니다.

### 1.2 핵심 설계 원칙

- **자율성 (Autonomy)**: 각 에이전트는 독립적으로 의사결정하고 작업을 수행
- **협업 (Collaboration)**: 에이전트 간 상호작용을 통해 복잡한 작업 완수
- **확장성 (Scalability)**: 새로운 에이전트 추가가 용이한 구조
- **투명성 (Transparency)**: 에이전트의 의사결정 과정 추적 가능
- **복원력 (Resilience)**: 에이전트 실패 시 전체 시스템 영향 최소화

---

## 2. 멀티 에이전트 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Orchestrator Layer                    │
│                  (LangGraph Workflow)                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌──────▼──────┐
│   Concierge   │  │   Operations    │  │ Intelligence│
│     Agent     │  │     Agent       │  │    Agent    │
└───────────────┘  └─────────────────┘  └─────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Shared Services     │
                │  - Memory (Redis)     │
                │  - Message Queue      │
                │  - Tool Registry      │
                └───────────────────────┘
```

### 2.2 레이어 구조

#### Layer 1: Orchestrator (오케스트레이터)
- **역할**: 전체 워크플로우 관리 및 에이전트 조율
- **기술**: LangGraph
- **책임**:
  - 사용자 요청 분석 및 적절한 에이전트로 라우팅
  - 에이전트 간 작업 순서 제어
  - 최종 결과 집계 및 반환

#### Layer 2: Specialized Agents (전문 에이전트)
- **역할**: 특정 도메인의 자율적 작업 수행
- **종류**: Concierge, Operations, Intelligence, Planner
- **책임**:
  - 할당된 작업의 독립적 실행
  - 필요 시 다른 에이전트와 협업
  - 작업 결과 및 상태 보고

#### Layer 3: Shared Services (공유 서비스)
- **역할**: 에이전트 간 공유 리소스 제공
- **구성**: Memory, Message Queue, Tool Registry
- **책임**:
  - 상태 정보 저장 및 공유
  - 에이전트 간 비동기 통신
  - 외부 도구 및 API 관리

---

## 3. 에이전트 상세 설계

### 3.1 Concierge Agent (고객 응대 에이전트)

**목적**: 회원과의 모든 상호작용 관리

**핵심 기능**:
- 회원 프로필 분석 및 선호도 학습
- 맞춤형 응답 생성
- 회원 문의 분류 및 적절한 에이전트로 전달

**입력**:
- 회원 메시지 (텍스트, 음성)
- 회원 프로필 (과거 이력, 선호도)

**출력**:
- 맞춤형 응답
- 다음 작업 지시 (Operations/Intelligence Agent로 전달)

**도구**:
- LLM (GPT-4, Claude)
- Vector DB (회원 이력 검색)
- CRM API (회원 정보 조회/업데이트)

**워크플로우 예시**:
```python
# Concierge Agent Workflow
1. 회원 메시지 수신
2. 회원 프로필 및 과거 이력 조회 (Vector DB)
3. 의도 분석 (LLM)
4. IF 간단한 문의:
     - 직접 응답 생성 및 전송
   ELIF 일정 관련:
     - Operations Agent로 전달
   ELIF 트렌드 정보 요청:
     - Intelligence Agent로 전달
5. 대화 이력 저장 (Memory)
```

### 3.2 Operations Agent (운영 자동화 에이전트)

**목적**: 연사 일정, 계약, 행정 업무 자동화

**핵심 기능**:
- 연사 스케줄 최적화
- 강연 요청 자동 조율
- NDA, 계약서 자동 생성
- 인보이스 처리

**입력**:
- 강연 요청 정보
- 연사 스케줄
- 계약 템플릿

**출력**:
- 최적 일정 제안
- 생성된 계약서/NDA
- 처리 완료 확인

**도구**:
- Calendar API (Google Calendar, Outlook)
- Document Generator (계약서 생성)
- Email API (자동 발송)
- Payment Gateway (인보이스 처리)

**최적화 알고리즘**:
```python
# Schedule Optimization
def optimize_schedule(speaker_id, event_request):
    """
    연사의 일정을 최적화하여 제안

    고려 요소:
    - 연사 선호 시간대
    - 이동 거리 (전후 일정 고려)
    - 강연 중요도 (우선순위)
    - 준비 시간 (최소 2시간 전)
    - 버퍼 시간 (강연 간 최소 4시간)
    """
    available_slots = get_available_slots(speaker_id)
    scored_slots = []

    for slot in available_slots:
        score = calculate_score(
            slot,
            preferences=get_speaker_preferences(speaker_id),
            travel_time=calculate_travel_time(slot),
            priority=event_request.priority
        )
        scored_slots.append((slot, score))

    return sorted(scored_slots, key=lambda x: x[1], reverse=True)[0]
```

### 3.3 Intelligence Agent (정보 수집 에이전트)

**목적**: 실시간 ICT 트렌드 모니터링 및 연사 평판 관리

**핵심 기능**:
- 글로벌 ICT 뉴스 수집 및 분석
- 연사 관련 소셜 미디어 모니터링
- 이상 징후 감지 및 알림
- 주간 트렌드 리포트 생성

**입력**:
- RSS 피드, 뉴스 API
- 소셜 미디어 데이터
- 연사 관심 키워드

**출력**:
- 트렌드 브리핑 (매일)
- 이상 징후 알림 (실시간)
- 주간 리포트

**도구**:
- Web Scraping (BeautifulSoup, Selenium)
- News API (Google News, Bing News)
- Social Media API (Twitter, LinkedIn)
- Sentiment Analysis (BERT, RoBERTa)

**모니터링 워크플로우**:
```python
# Intelligence Monitoring Loop
while True:
    # 1. 데이터 수집
    news = fetch_news(keywords=["AI", "ICT", "생성형 AI"])
    social = fetch_social_media(speaker_handles)

    # 2. 감성 분석
    sentiment = analyze_sentiment(news + social)

    # 3. 이상 징후 감지
    if detect_anomaly(sentiment):
        send_alert(
            type="reputation_risk",
            severity=calculate_severity(sentiment),
            details=generate_report(sentiment)
        )

    # 4. 트렌드 분석
    trends = extract_trends(news)
    store_trends(trends)

    # 5. 대기
    sleep(3600)  # 1시간마다 실행
```

### 3.4 Planner Agent (계획 에이전트)

**목적**: 복잡한 목표를 하위 작업으로 분해 및 실행 계획 수립

**핵심 기능**:
- 목표 분해 (Goal Decomposition)
- 의존성 분석
- 실행 순서 최적화
- 작업 할당

**입력**:
- 고수준 목표 (예: "박태웅 위원의 3월 일정 최적화")

**출력**:
- 실행 가능한 하위 작업 리스트
- 작업 간 의존성 그래프
- 각 작업의 담당 에이전트

**알고리즘**:
```python
# Planner Agent - Goal Decomposition
def decompose_goal(goal):
    """
    복잡한 목표를 실행 가능한 하위 작업으로 분해
    """
    # 1. LLM을 사용하여 목표 분석
    analysis = llm.analyze(f"Decompose this goal into subtasks: {goal}")

    # 2. 하위 작업 추출
    subtasks = extract_subtasks(analysis)

    # 3. 의존성 분석
    dependencies = analyze_dependencies(subtasks)

    # 4. DAG (Directed Acyclic Graph) 생성
    task_graph = build_dag(subtasks, dependencies)

    # 5. 실행 순서 결정 (Topological Sort)
    execution_order = topological_sort(task_graph)

    # 6. 각 작업에 에이전트 할당
    assigned_tasks = []
    for task in execution_order:
        agent = select_best_agent(task)
        assigned_tasks.append({
            "task": task,
            "agent": agent,
            "estimated_time": estimate_time(task)
        })

    return assigned_tasks
```

---

## 4. 에이전트 간 통신 프로토콜

### 4.1 메시지 형식

모든 에이전트 간 통신은 표준화된 JSON 메시지 형식을 사용합니다.

```json
{
  "message_id": "msg_20260216_001",
  "timestamp": "2026-02-16T12:00:00Z",
  "from_agent": "concierge_agent",
  "to_agent": "operations_agent",
  "message_type": "task_request",
  "priority": "high",
  "payload": {
    "task_type": "schedule_optimization",
    "speaker_id": "speaker_001",
    "event_details": {
      "title": "AI 윤리 세미나",
      "date": "2026-03-15",
      "location": "서울 강남구",
      "duration": 120
    }
  },
  "context": {
    "user_id": "user_123",
    "session_id": "session_456"
  },
  "callback": "concierge_agent/handle_response"
}
```

### 4.2 통신 패턴

#### 패턴 1: Request-Response (요청-응답)
```
Concierge Agent → Operations Agent: "일정 최적화 요청"
Operations Agent → Concierge Agent: "최적 일정 제안"
```

#### 패턴 2: Pub-Sub (발행-구독)
```
Intelligence Agent → Message Queue: "트렌드 업데이트 발행"
Concierge Agent ← Message Queue: "트렌드 업데이트 수신"
Operations Agent ← Message Queue: "트렌드 업데이트 수신"
```

#### 패턴 3: Sequential (순차 실행)
```
Planner → Operations Agent: "작업 1 실행"
Operations Agent → Planner: "작업 1 완료"
Planner → Intelligence Agent: "작업 2 실행"
Intelligence Agent → Planner: "작업 2 완료"
```

### 4.3 에러 처리

에이전트 실패 시 다음 전략을 사용합니다:

1. **Retry (재시도)**: 일시적 오류의 경우 최대 3회 재시도
2. **Fallback (대체)**: 실패 시 대체 에이전트로 전환
3. **Circuit Breaker**: 연속 실패 시 해당 에이전트 일시 차단
4. **Graceful Degradation**: 기능 축소하여 서비스 지속

```python
# Error Handling Example
def execute_with_retry(agent, task, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = agent.execute(task)
            return result
        except TemporaryError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                time.sleep(wait_time)
                continue
            else:
                # Fallback to alternative agent
                fallback_agent = get_fallback_agent(agent)
                return fallback_agent.execute(task)
        except CriticalError as e:
            # Log and alert
            log_error(e)
            send_alert(f"Critical error in {agent.name}: {e}")
            raise
```

---

## 5. 상태 관리 및 메모리

### 5.1 4계층 메모리 시스템

AI 에이전트는 인간의 인지 체계를 모방한 4계층 메모리를 사용합니다.

#### 1. 경험적 메모리 (Episodic Memory)
- **저장**: 대화 흐름, 사용자 상호작용
- **구현**: Redis (TTL 7일)
- **용도**: 최근 대화 맥락 유지

#### 2. 의미적 메모리 (Semantic Memory)
- **저장**: 사실 지식, 도메인 정보
- **구현**: Vector DB (영구 저장)
- **용도**: 연사 정보, 회원 프로필, ICT 지식

#### 3. 절차적 메모리 (Procedural Memory)
- **저장**: 업무 매뉴얼, 프로세스
- **구현**: Code Repository
- **용도**: 에이전트 동작 방식, 워크플로우

#### 4. 작업 메모리 (Working Memory)
- **저장**: 현재 작업 맥락
- **구현**: In-memory (현재 세션)
- **용도**: 진행 중인 작업의 임시 데이터

### 5.2 메모리 아키텍처

```
┌─────────────────────────────────────┐
│         Working Memory              │
│      (Current Session Data)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Episodic Memory               │
│    (Recent Conversations)           │
│         Redis (TTL 7d)              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Semantic Memory               │
│   (Facts & Knowledge)               │
│    Vector DB (Persistent)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Procedural Memory              │
│    (Process & Workflows)            │
│      Code Repository                │
└─────────────────────────────────────┘
```

---

## 6. 도구 연동 (MCP - Model Context Protocol)

### 6.1 MCP 개요

MCP(Model Context Protocol)는 AI 에이전트가 외부 시스템과 상호작용할 수 있도록 하는 표준 프로토콜입니다.

### 6.2 주요 연동 도구

| 도구 카테고리 | 도구 이름 | 용도 |
|------------|---------|------|
| Calendar | Google Calendar, Outlook | 일정 관리 |
| CRM | Salesforce, HubSpot | 회원 정보 관리 |
| Communication | Gmail, Slack | 메시지 발송 |
| Document | Google Docs, Notion | 문서 생성/관리 |
| Payment | Stripe, PayPal | 결제 처리 |
| Data | PostgreSQL, Redis | 데이터 저장/조회 |

### 6.3 MCP Connector 예시

```python
# MCP Connector for Google Calendar
class GoogleCalendarConnector:
    def __init__(self, credentials):
        self.service = build('calendar', 'v3', credentials=credentials)

    def get_events(self, calendar_id, time_min, time_max):
        """일정 조회"""
        events_result = self.service.events().list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        return events_result.get('items', [])

    def create_event(self, calendar_id, event):
        """일정 생성"""
        event = self.service.events().insert(
            calendarId=calendar_id,
            body=event
        ).execute()
        return event

    def check_availability(self, calendar_id, start_time, end_time):
        """가용 시간 확인"""
        events = self.get_events(calendar_id, start_time, end_time)
        return len(events) == 0  # 일정이 없으면 가용
```

---

## 7. 실제 워크플로우 예시

### 7.1 시나리오: "경영진이 AI 전략 자문 요청"

**단계별 에이전트 상호작용**:

```
1. [User] → [Concierge Agent]
   "다음 달 이사회에서 발표할 AI 전략에 대해 박태웅 위원의 자문을 받고 싶습니다."

2. [Concierge Agent] → [Intelligence Agent]
   "박태웅 위원의 최근 관심사 및 발언 내역 조회"

3. [Intelligence Agent] → [Concierge Agent]
   "최근 AI 윤리, 기술 문해력에 대한 발언 다수.
    관련 기고문 3건, 강연 2건 확인됨."

4. [Concierge Agent] → [Planner Agent]
   "박태웅 위원과의 자문 미팅 준비 계획 수립"

5. [Planner Agent] → [Operations Agent]
   하위 작업 1: "박태웅 위원의 3월 일정 확인"
   하위 작업 2: "최적 미팅 시간 제안"
   하위 작업 3: "미팅 준비 자료 생성"

6. [Operations Agent] → [Planner Agent]
   "3월 15일(수) 오후 2시, 3월 20일(월) 오전 10시 가능"

7. [Planner Agent] → [Concierge Agent]
   "실행 계획 완료: 2개의 후보 일정 확보,
    브리핑 자료 생성 대기 중"

8. [Concierge Agent] → [User]
   "박태웅 위원과의 자문 미팅이 가능한 시간은 다음과 같습니다:
    - 3월 15일(수) 오후 2시
    - 3월 20일(월) 오전 10시

    위원님은 최근 AI 윤리와 기술 문해력에 집중하고 계십니다.
    이사회 발표 주제와 관련하여 어떤 측면을 중점적으로
    논의하고 싶으신가요?"
```

### 7.2 에이전트 협업 다이어그램

```
User
 │
 └─→ Concierge Agent (진입점)
      │
      ├─→ Intelligence Agent (정보 수집)
      │    └─→ 박태웅 위원 최근 활동 조회
      │
      └─→ Planner Agent (계획 수립)
           │
           └─→ Operations Agent (일정 조율)
                │
                ├─→ Google Calendar API
                └─→ Document Generator
```

---

## 8. 기술 스택

### 8.1 AI/ML 프레임워크

| 기술 | 용도 | 버전 |
|-----|------|------|
| LangGraph | 에이전트 워크플로우 오케스트레이션 | Latest |
| LangChain | LLM 체인 및 에이전트 관리 | 0.1+ |
| LlamaIndex | 지식 베이스 인덱싱 | 0.9+ |
| OpenAI API | GPT-4 (LLM) | v1 |
| Anthropic API | Claude 3 (LLM) | v1 |

### 8.2 백엔드 & 인프라

| 기술 | 용도 | 버전 |
|-----|------|------|
| Python | 주 프로그래밍 언어 | 3.11+ |
| FastAPI | REST API 서버 | 0.100+ |
| Redis | 캐시 및 메시지 큐 | 7.0+ |
| PostgreSQL | 관계형 데이터베이스 | 15+ |
| Qdrant / Pinecone | Vector DB | Latest |
| Neo4j | 지식 그래프 | 5.0+ |

### 8.3 DevOps

| 기술 | 용도 |
|-----|------|
| Docker | 컨테이너화 |
| Kubernetes | 오케스트레이션 |
| AWS / Azure | 클라우드 인프라 |
| GitHub Actions | CI/CD |
| Prometheus + Grafana | 모니터링 |

---

## 9. 성능 및 확장성

### 9.1 성능 목표

- **응답 시간**: 95 백분위수 기준 2초 이내
- **에이전트 처리 속도**: 평균 5초 이내
- **동시 처리**: 100명 이상 동시 사용자 지원

### 9.2 확장 전략

1. **수평적 확장**: 에이전트 인스턴스 증가
2. **로드 밸런싱**: 작업을 여러 에이전트에 분산
3. **캐싱**: 자주 사용되는 데이터 캐시
4. **비동기 처리**: 메시지 큐를 통한 비동기 작업

---

## 10. 다음 단계

이 아키텍처 설계를 바탕으로 다음 문서들이 작성됩니다:

1. **에이전틱 RAG 시스템 설계서** - 지식 베이스 구축 방법
2. **경영진 AI 비서 설계서** - Summary-First UI 및 ECIF 프레임워크
3. **데이터베이스 스키마** - 데이터 모델 및 ERD
4. **API 명세서** - REST API 엔드포인트 정의

---

## 부록 A: 참고 문헌

1. LangGraph Documentation: https://langchain-ai.github.io/langgraph/
2. Multi-Agent Systems: A Modern Approach (Wooldridge, 2009)
3. NIST AI Risk Management Framework 1.0
4. Model Context Protocol Specification

---

**문서 작성**: Garambada | skangbada@gmail.com
**문서 ID**: ARCH-AI-AGENT-2026-001
**상태**: Draft → Review 대기
