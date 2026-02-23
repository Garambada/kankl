# Agentic RAG System Design
## 에이전틱 RAG 시스템 설계서

**프로젝트**: AI-Native Speaker Management Pilot System
**문서 버전**: v1.0
**작성일**: 2026-02-16
**작성자**: Garambada

---

## 1. 시스템 개요

### 1.1 목적
전문가의 지식(저서, 기고문, 강연)을 디지털 페르소나로 전환하여, 그들의 물리적 부재 시에도 통찰력을 제공하는 지식 자산화 시스템

### 1.2 핵심 기능
- **지식 인덱싱**: 전문가의 모든 콘텐츠 자동 수집 및 벡터화
- **ID-RAG**: 전문가 특유의 말투와 철학을 유지하며 답변 생성
- **Pre-advisory**: 경영진 질문에 대한 1차 전략 제안
- **콘텐츠 생성**: 기고문, SNS 콘텐츠 자동 생성

---

## 2. 아키텍처 설계

### 2.1 전체 구조

```
사용자 질의
    ↓
┌─────────────────────────────────────┐
│      Query Understanding            │
│   (의도 분석 및 질의 재작성)          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│      Router Agent                   │
│  (적절한 전문가 KB 선택)              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│    Retrieval (하이브리드 검색)       │
│  Vector DB + Knowledge Graph        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│    Reranking (재순위화)              │
│  관련성 점수 기반 정렬                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│    ID-RAG Generation                │
│  (전문가 페르소나 유지하며 생성)      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│    Critic Agent                     │
│  (답변 검증 및 수정)                 │
└─────────────────────────────────────┘
    ↓
최종 답변
```

### 2.2 핵심 컴포넌트

#### (1) 지식 인덱싱 파이프라인
```python
# 데이터 수집 → 정제 → 청킹 → 임베딩 → 저장

1. Data Collection
   - 저서: PDF 파싱
   - 기고문: 웹 스크래핑
   - 강연: 음성→텍스트 변환
   - 인터뷰: 텍스트 추출

2. Preprocessing
   - 노이즈 제거
   - 중복 제거
   - 메타데이터 추출 (날짜, 주제, 키워드)

3. Chunking Strategy
   - 의미 단위 분할 (Semantic Chunking)
   - 청크 크기: 500-1000 토큰
   - 오버랩: 100 토큰

4. Embedding
   - 모델: text-embedding-3-large (OpenAI)
   - 차원: 3072
   - 배치 처리: 100개씩

5. Storage
   - Vector DB: Qdrant
   - Knowledge Graph: Neo4j
   - 메타데이터: PostgreSQL
```

#### (2) ID-RAG (Identity Retrieval-Augmented Generation)

**핵심 아이디어**: 전문가의 정체성(말투, 가치관, 철학)을 구조화하여 답변에 반영

```python
# ID-RAG 구현

class ExpertPersona:
    """전문가 페르소나 정의"""
    def __init__(self, expert_name):
        self.name = expert_name
        self.core_beliefs = []      # 핵심 신념
        self.speaking_style = {}    # 말투 특징
        self.key_phrases = []       # 자주 사용하는 표현
        self.values = []            # 가치관

# 박태웅 위원 페르소나 예시
park_persona = ExpertPersona("박태웅")
park_persona.core_beliefs = [
    "기술은 인간을 위한 도구여야 한다",
    "AI 시대에는 올바른 질문이 중요하다",
    "기술 문해력은 현대인의 필수 역량이다"
]
park_persona.speaking_style = {
    "tone": "따뜻하고 사려깊은",
    "complexity": "복잡한 개념을 쉽게 풀어냄",
    "examples": "일상적 비유를 자주 사용"
}
park_persona.key_phrases = [
    "본질적으로",
    "결국 중요한 것은",
    "우리가 던져야 할 질문은"
]

def generate_with_persona(query, retrieved_docs, persona):
    """페르소나를 반영한 답변 생성"""
    prompt = f"""
    당신은 {persona.name}입니다.

    핵심 신념: {persona.core_beliefs}
    말투: {persona.speaking_style}
    자주 사용하는 표현: {persona.key_phrases}

    다음 문서들을 참고하여, {persona.name}의 관점에서 답변하세요:
    {retrieved_docs}

    질문: {query}
    """
    return llm.generate(prompt)
```

#### (3) 하이브리드 검색

Vector Search와 Knowledge Graph를 결합하여 정확도 향상

```python
def hybrid_search(query, top_k=10):
    """하이브리드 검색"""

    # 1. Dense Retrieval (Vector Search)
    query_embedding = embed(query)
    vector_results = vector_db.search(
        query_embedding,
        top_k=top_k,
        filter={"expert": "박태웅"}
    )

    # 2. Sparse Retrieval (BM25)
    bm25_results = bm25_index.search(query, top_k=top_k)

    # 3. Knowledge Graph Traversal
    entities = extract_entities(query)
    kg_results = knowledge_graph.traverse(
        start_nodes=entities,
        max_hops=2
    )

    # 4. 결과 통합 (RRF - Reciprocal Rank Fusion)
    combined_results = reciprocal_rank_fusion([
        vector_results,
        bm25_results,
        kg_results
    ])

    return combined_results[:top_k]
```

---

## 3. 데이터 모델

### 3.1 Vector DB 스키마 (Qdrant)

```python
{
    "id": "doc_001",
    "vector": [0.123, 0.456, ...],  # 3072차원
    "payload": {
        "expert_id": "speaker_001",
        "expert_name": "박태웅",
        "source_type": "book",           # book, article, speech, interview
        "source_title": "AI 시대의 문해력",
        "chunk_text": "...",
        "date": "2025-06-15",
        "keywords": ["AI", "문해력", "교육"],
        "topic": "AI 교육",
        "importance_score": 0.85
    }
}
```

### 3.2 Knowledge Graph 스키마 (Neo4j)

```cypher
// 노드 타입
(:Expert {name, bio, expertise})
(:Concept {name, definition})
(:Topic {name, category})
(:Document {title, date, type})

// 관계 타입
(:Expert)-[:BELIEVES_IN]->(:Concept)
(:Expert)-[:SPEAKS_ABOUT]->(:Topic)
(:Expert)-[:AUTHORED]->(:Document)
(:Concept)-[:RELATED_TO]->(:Concept)
(:Topic)-[:INCLUDES]->(:Concept)

// 예시 쿼리: 박태웅 위원의 AI 교육 관련 신념
MATCH (e:Expert {name: "박태웅"})-[:BELIEVES_IN]->(c:Concept)<-[:INCLUDES]-(t:Topic {name: "AI 교육"})
RETURN c.definition
```

---

## 4. Pre-advisory 시스템

### 4.1 워크플로우

```
경영진 질문
    ↓
┌─────────────────────────────────────┐
│  1. 문제 분석                        │
│     - 질문 유형 분류                 │
│     - 핵심 이슈 추출                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  2. 지식 검색                        │
│     - 관련 전문가 선택               │
│     - 하이브리드 검색 수행           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  3. 전략 제안 생성                   │
│     - 옵션 A, B, C 도출             │
│     - 각 옵션의 장단점 분석          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  4. 실행 계획 수립                   │
│     - 단계별 액션 아이템             │
│     - 필요 리소스 명시               │
└─────────────────────────────────────┘
    ↓
1차 전략 제안서
```

### 4.2 출력 형식

```markdown
## Pre-Advisory Report

**질문**: [경영진의 원본 질문]
**분석일**: 2026-02-16
**전문가 관점**: 박태웅 (AI 문해력 전문가)

### 핵심 이슈
- 이슈 1
- 이슈 2
- 이슈 3

### 전략 옵션

#### 옵션 A: [제목]
**장점**:
- 장점 1
- 장점 2

**단점**:
- 단점 1
- 단점 2

**실행 단계**:
1. 단계 1
2. 단계 2

#### 옵션 B: [제목]
...

### 추천 사항
박태웅 위원의 관점에서 옵션 A를 추천합니다. 이유는...

### 다음 단계
실제 자문 미팅을 통해 더 깊이 논의할 사항:
- 논의 포인트 1
- 논의 포인트 2
```

---

## 5. 콘텐츠 자동 생성

### 5.1 기고문 생성

```python
def generate_article(topic, expert_persona, target_length=1500):
    """
    전문가의 스타일로 기고문 생성
    """
    # 1. 관련 지식 검색
    relevant_docs = hybrid_search(
        query=topic,
        expert=expert_persona.name
    )

    # 2. 아웃라인 생성
    outline = generate_outline(topic, relevant_docs, expert_persona)

    # 3. 섹션별 작성
    sections = []
    for section in outline:
        content = generate_section(
            section_title=section,
            context=relevant_docs,
            persona=expert_persona,
            target_length=target_length // len(outline)
        )
        sections.append(content)

    # 4. 전체 통합 및 편집
    full_article = integrate_sections(sections)

    # 5. 페르소나 일치도 검증
    consistency_score = verify_persona_consistency(
        full_article,
        expert_persona
    )

    if consistency_score < 0.8:
        full_article = refine_article(full_article, expert_persona)

    return full_article
```

---

## 6. 성능 최적화

### 6.1 Semantic Caching

자주 묻는 질문에 대해 캐싱하여 응답 속도 향상

```python
# Redis를 사용한 Semantic Cache
def semantic_cache_lookup(query, threshold=0.95):
    """
    의미적으로 유사한 캐시 검색
    """
    query_embedding = embed(query)

    # Redis에서 유사한 질의 검색
    similar_queries = redis_vector_search(
        query_embedding,
        top_k=1,
        threshold=threshold
    )

    if similar_queries:
        cached_response = redis.get(similar_queries[0].id)
        return cached_response

    return None
```

### 6.2 성능 지표

| 지표 | 목표 | 측정 방법 |
|-----|------|----------|
| Context Precision | > 0.85 | 검색된 문서의 관련성 |
| Context Recall | > 0.90 | 필요한 정보의 포함 여부 |
| Answer Relevancy | > 0.90 | 답변의 질문 관련성 |
| Faithfulness | > 0.95 | 답변의 출처 충실도 |
| Persona Consistency | > 0.85 | 전문가 페르소나 유지도 |

---

## 7. 기술 스택

| 레이어 | 기술 | 용도 |
|-------|------|------|
| Embedding | OpenAI text-embedding-3-large | 텍스트 벡터화 |
| Vector DB | Qdrant | 벡터 검색 |
| Knowledge Graph | Neo4j | 개념 관계 저장 |
| LLM | GPT-4, Claude 3 | 답변 생성 |
| Framework | LangChain, LlamaIndex | RAG 파이프라인 |
| Cache | Redis | Semantic Caching |

---

## 8. 구현 단계

### Phase 1: 데이터 수집 및 인덱싱 (Month 1-2)
- 박태웅, 한상기, 윤대균 3인의 콘텐츠 수집
- 전처리 및 청킹
- Vector DB 및 Knowledge Graph 구축

### Phase 2: 페르소나 모델링 (Month 2-3)
- 각 전문가의 페르소나 정의
- ID-RAG 엔진 구현
- 일관성 검증 시스템 구축

### Phase 3: Pre-advisory 시스템 (Month 3-4)
- 전략 제안 생성 로직 구현
- 옵션 분석 알고리즘 개발
- 출력 형식 표준화

### Phase 4: 검증 및 최적화 (Month 4-5)
- 성능 지표 측정
- 페르소나 일치도 테스트
- Semantic Caching 도입

---

**문서 ID**: ARCH-RAG-2026-001
**작성자**: Garambada | skangbada@gmail.com
