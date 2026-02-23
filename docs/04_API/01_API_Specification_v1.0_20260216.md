# API Specification
## API 명세서

**프로젝트**: AI-Native Speaker Management Pilot System
**문서 버전**: v1.0
**작성일**: 2026-02-16
**작성자**: Garambada
**Base URL**: `https://api.boardroomclub.ai/v1`

---

## 1. API 개요

### 1.1 설계 원칙

- **RESTful**: 리소스 중심 설계
- **Stateless**: 무상태 요청/응답
- **JSON**: 모든 요청/응답은 JSON 형식
- **HTTPS Only**: 모든 통신은 TLS 1.3 이상
- **Versioning**: URL 경로에 버전 포함 (`/v1`)

### 1.2 인증

#### JWT Bearer Token 방식

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**토큰 구조**:
```json
{
  "user_id": "uuid",
  "email": "ceo@company.com",
  "role": "executive",
  "tier": "platinum",
  "iat": 1708070400,
  "exp": 1708156800
}
```

### 1.3 Rate Limiting

| 티어 | 요청 제한 |
|------|----------|
| Platinum | 10,000 req/hour |
| Gold | 5,000 req/hour |
| Silver | 2,000 req/hour |
| Trial | 500 req/hour |

**Rate Limit 헤더**:
```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 1708074000
```

### 1.4 공통 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-02-16T09:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": { }
  },
  "meta": {
    "timestamp": "2026-02-16T09:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## 2. 인증 & 사용자 관리

### 2.1 회원가입

```http
POST /auth/register
```

**Request Body**:
```json
{
  "email": "ceo@company.com",
  "password": "SecurePassword123!",
  "full_name": "홍길동",
  "company": "ABC Corp",
  "position": "CEO",
  "phone": "+82-10-1234-5678"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "email": "ceo@company.com",
    "full_name": "홍길동",
    "tier": "trial",
    "created_at": "2026-02-16T09:30:00Z"
  },
  "meta": {
    "timestamp": "2026-02-16T09:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 2.2 로그인

```http
POST /auth/login
```

**Request Body**:
```json
{
  "email": "ceo@company.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "user_id": "usr_abc123",
      "email": "ceo@company.com",
      "full_name": "홍길동",
      "tier": "platinum",
      "role": "executive"
    }
  }
}
```

### 2.3 토큰 갱신

```http
POST /auth/refresh
```

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

### 2.4 사용자 프로필 조회

```http
GET /users/me
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "email": "ceo@company.com",
    "full_name": "홍길동",
    "company": "ABC Corp",
    "position": "CEO",
    "tier": "platinum",
    "role": "executive",
    "preferences": {
      "interests": ["AI", "클라우드", "보안"],
      "notification_enabled": true,
      "language": "ko"
    },
    "created_at": "2026-01-15T08:00:00Z",
    "last_login_at": "2026-02-16T09:00:00Z"
  }
}
```

### 2.5 사용자 프로필 수정

```http
PATCH /users/me
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "full_name": "홍길동",
  "phone": "+82-10-9876-5432",
  "preferences": {
    "interests": ["AI", "블록체인", "클라우드"]
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "updated_at": "2026-02-16T09:35:00Z"
  }
}
```

---

## 3. 전문가 (Speakers)

### 3.1 전문가 목록 조회

```http
GET /speakers?page=1&limit=10&expertise=AI
Authorization: Bearer {token}
```

**Query Parameters**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)
- `expertise`: 전문 분야 필터 (예: "AI", "클라우드")
- `sort`: 정렬 기준 (예: "rating", "sessions")

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "speakers": [
      {
        "speaker_id": "spk_001",
        "name": "박태웅",
        "slug": "park-taewung",
        "bio": "한빛미디어 이사회 의장, AI 문해력 전문가",
        "profile_image_url": "https://cdn.boardroomclub.ai/speakers/park.jpg",
        "expertise": ["AI", "문해력", "교육"],
        "average_rating": 4.9,
        "total_sessions": 156,
        "hourly_rate": {
          "platinum": 0,
          "gold": 500000,
          "silver": 800000
        },
        "is_available": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 3,
      "per_page": 10
    }
  }
}
```

### 3.2 전문가 상세 정보

```http
GET /speakers/{speaker_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "speaker_id": "spk_001",
    "name": "박태웅",
    "slug": "park-taewung",
    "bio": "한빛미디어 이사회 의장...",
    "profile_image_url": "https://cdn.boardroomclub.ai/speakers/park.jpg",
    "expertise": ["AI", "문해력", "교육"],
    "core_beliefs": [
      "기술은 인간을 위한 도구여야 한다",
      "AI 시대에는 올바른 질문이 중요하다"
    ],
    "speaking_style": {
      "tone": "따뜻하고 사려깊은",
      "complexity": "복잡한 개념을 쉽게 풀어냄"
    },
    "key_phrases": [
      "본질적으로",
      "결국 중요한 것은"
    ],
    "average_rating": 4.9,
    "total_sessions": 156,
    "recent_topics": [
      "AI 문해력",
      "생성형 AI 활용",
      "AI 시대의 교육"
    ],
    "availability_schedule": {
      "monday": ["09:00-12:00", "14:00-17:00"],
      "tuesday": ["09:00-12:00"],
      "wednesday": ["14:00-17:00"],
      "thursday": ["09:00-12:00", "14:00-17:00"],
      "friday": ["09:00-12:00"]
    }
  }
}
```

### 3.3 전문가 콘텐츠 검색

```http
GET /speakers/{speaker_id}/contents?query=AI+윤리&limit=10
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "contents": [
      {
        "content_id": "cnt_001",
        "title": "AI 시대의 윤리적 고민",
        "source_type": "article",
        "excerpt": "AI가 발전하면서 우리는...",
        "published_date": "2025-08-20",
        "relevance_score": 0.92,
        "url": "https://example.com/article"
      }
    ],
    "total": 5
  }
}
```

---

## 4. 예약 (Bookings)

### 4.1 예약 가능 시간 조회

```http
GET /speakers/{speaker_id}/availability?date=2026-02-20
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "date": "2026-02-20",
    "available_slots": [
      {
        "start": "2026-02-20T09:00:00+09:00",
        "end": "2026-02-20T10:00:00+09:00",
        "duration_minutes": 60
      },
      {
        "start": "2026-02-20T10:00:00+09:00",
        "end": "2026-02-20T11:00:00+09:00",
        "duration_minutes": 60
      }
    ]
  }
}
```

### 4.2 예약 생성

```http
POST /bookings
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "speaker_id": "spk_001",
  "booking_type": "video",
  "scheduled_start": "2026-02-20T10:00:00+09:00",
  "duration_minutes": 60,
  "agenda": "AI 전략 수립을 위한 자문",
  "include_pre_advisory": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "booking_id": "bkg_001",
    "user_id": "usr_abc123",
    "speaker_id": "spk_001",
    "booking_type": "video",
    "scheduled_start": "2026-02-20T10:00:00+09:00",
    "scheduled_end": "2026-02-20T11:00:00+09:00",
    "duration_minutes": 60,
    "status": "pending",
    "amount": 0,
    "currency": "KRW",
    "meeting_url": null,
    "pre_advisory_report_id": "rep_001",
    "created_at": "2026-02-16T09:40:00Z"
  }
}
```

### 4.3 예약 목록 조회

```http
GET /bookings?status=confirmed&page=1&limit=10
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "booking_id": "bkg_001",
        "speaker": {
          "speaker_id": "spk_001",
          "name": "박태웅",
          "profile_image_url": "https://cdn.boardroomclub.ai/speakers/park.jpg"
        },
        "scheduled_start": "2026-02-20T10:00:00+09:00",
        "scheduled_end": "2026-02-20T11:00:00+09:00",
        "status": "confirmed",
        "booking_type": "video",
        "meeting_url": "https://meet.boardroomclub.ai/bkg_001"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_items": 15,
      "per_page": 10
    }
  }
}
```

### 4.4 예약 상세 조회

```http
GET /bookings/{booking_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "booking_id": "bkg_001",
    "user": {
      "user_id": "usr_abc123",
      "full_name": "홍길동",
      "company": "ABC Corp"
    },
    "speaker": {
      "speaker_id": "spk_001",
      "name": "박태웅"
    },
    "scheduled_start": "2026-02-20T10:00:00+09:00",
    "scheduled_end": "2026-02-20T11:00:00+09:00",
    "duration_minutes": 60,
    "status": "confirmed",
    "booking_type": "video",
    "meeting_url": "https://meet.boardroomclub.ai/bkg_001",
    "agenda": "AI 전략 수립을 위한 자문",
    "pre_advisory_report_id": "rep_001",
    "payment": {
      "amount": 0,
      "currency": "KRW",
      "status": "completed"
    },
    "created_at": "2026-02-16T09:40:00Z",
    "updated_at": "2026-02-16T09:45:00Z"
  }
}
```

### 4.5 예약 취소

```http
DELETE /bookings/{booking_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "booking_id": "bkg_001",
    "status": "cancelled",
    "cancelled_at": "2026-02-18T14:20:00Z",
    "refund_amount": 0
  }
}
```

---

## 5. AI 자문 (Advisory)

### 5.1 Pre-Advisory 생성

```http
POST /advisory/pre-advisory
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "speaker_id": "spk_001",
  "query": "우리 회사가 생성형 AI를 도입하려고 하는데, 어떤 전략으로 접근해야 할까요?"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "report_id": "rep_001",
    "speaker_id": "spk_001",
    "query": "우리 회사가 생성형 AI를...",
    "status": "processing",
    "estimated_completion": "2026-02-16T09:50:00Z"
  }
}
```

### 5.2 Pre-Advisory 조회

```http
GET /advisory/pre-advisory/{report_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "report_id": "rep_001",
    "speaker": {
      "speaker_id": "spk_001",
      "name": "박태웅"
    },
    "query": "우리 회사가 생성형 AI를...",
    "status": "completed",
    "analysis": {
      "key_issues": [
        "조직 문화와 AI 수용성 평가 필요",
        "명확한 사용 사례(Use Case) 정의",
        "데이터 준비 상태 점검"
      ],
      "opportunities": [
        "고객 서비스 자동화",
        "내부 업무 효율화",
        "신규 서비스 개발"
      ],
      "risks": [
        "초기 투자 비용",
        "조직 저항",
        "데이터 품질 이슈"
      ]
    },
    "options": [
      {
        "title": "점진적 도입 (파일럿 프로젝트)",
        "description": "특정 부서에서 소규모로 시작...",
        "pros": [
          "리스크 최소화",
          "학습 기회 확보",
          "점진적 확산 가능"
        ],
        "cons": [
          "효과 검증에 시간 소요",
          "조직 전체 혜택 지연"
        ],
        "estimated_cost": "5천만원",
        "timeline": "3-6개월",
        "risk_level": "낮음"
      },
      {
        "title": "전사적 도입",
        "description": "처음부터 전사 차원에서...",
        "pros": [
          "빠른 효과",
          "조직 전체 시너지"
        ],
        "cons": [
          "높은 초기 비용",
          "조직 혼란 가능성"
        ],
        "estimated_cost": "3억원",
        "timeline": "6-12개월",
        "risk_level": "높음"
      }
    ],
    "recommendation": {
      "preferred_option": "점진적 도입 (파일럿 프로젝트)",
      "rationale": "귀사의 현재 AI 성숙도를 고려할 때, 파일럿 프로젝트로 시작하는 것이 가장 안전하고 효과적입니다...",
      "next_steps": [
        "파일럿 부서 선정 (고객 서비스팀 추천)",
        "명확한 성공 지표 정의",
        "3개월 간 시범 운영",
        "결과 평가 후 확대 결정"
      ]
    },
    "confidence_score": 0.88,
    "sources": [
      {
        "content_id": "cnt_001",
        "title": "생성형 AI 도입 전략",
        "source_type": "article"
      }
    ],
    "generated_at": "2026-02-16T09:48:00Z"
  }
}
```

### 5.3 실시간 대화 (Chat)

```http
POST /advisory/chat
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "speaker_id": "spk_001",
  "conversation_id": "conv_001",
  "message": "AI 도입 시 직원 교육은 어떻게 해야 하나요?"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_001",
    "message_id": "msg_001",
    "speaker": {
      "speaker_id": "spk_001",
      "name": "박태웅"
    },
    "response": "직원 교육은 AI 도입의 성공을 좌우하는 핵심 요소입니다. 제가 추천하는 교육 전략은 다음과 같습니다:\n\n1. **단계별 교육**:\n   - 1단계: AI 기초 이해 (전 직원)\n   - 2단계: 실무 활용 교육 (핵심 사용자)\n   - 3단계: 고급 활용 (파워 유저)\n\n2. **실습 중심 교육**:\n   - 이론보다는 실제 업무 시나리오 기반\n   - Hands-on 워크숍 진행\n\n3. **지속적 학습 환경**:\n   - 내부 커뮤니티 구축\n   - 정기적인 사례 공유 세션\n\n본질적으로, 교육은 일회성이 아닌 지속적인 프로세스로 접근해야 합니다.",
    "sources": [
      {
        "content_id": "cnt_005",
        "title": "AI 시대의 조직 문화"
      }
    ],
    "tokens_used": 450,
    "created_at": "2026-02-16T10:00:00Z"
  }
}
```

### 5.4 대화 이력 조회

```http
GET /advisory/conversations/{conversation_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_001",
    "speaker": {
      "speaker_id": "spk_001",
      "name": "박태웅"
    },
    "messages": [
      {
        "message_id": "msg_001",
        "role": "user",
        "content": "AI 도입 시 직원 교육은...",
        "created_at": "2026-02-16T10:00:00Z"
      },
      {
        "message_id": "msg_002",
        "role": "assistant",
        "content": "직원 교육은 AI 도입의...",
        "created_at": "2026-02-16T10:00:05Z"
      }
    ],
    "summary": "AI 도입 시 직원 교육 전략에 대한 대화",
    "total_messages": 2,
    "started_at": "2026-02-16T10:00:00Z",
    "last_message_at": "2026-02-16T10:00:05Z"
  }
}
```

---

## 6. 일일 브리핑 (Daily Briefing)

### 6.1 오늘의 브리핑 조회

```http
GET /briefings/today
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "date": "2026-02-16",
    "executive_summary": [
      {
        "title": "OpenAI, GPT-5 출시 발표",
        "impact": "귀사의 AI 전략 재검토 필요",
        "urgency": "high"
      }
    ],
    "top_news": [
      {
        "news_id": "news_001",
        "title": "OpenAI, GPT-5 출시 발표",
        "source": "TechCrunch",
        "published_at": "2026-02-16T08:00:00Z",
        "what": "OpenAI가 차세대 모델 GPT-5를 공개했습니다...",
        "so_what": "귀사 산업에 미치는 영향:\n- 고객 서비스 자동화 수준 향상 가능\n- 경쟁사 대비 기술 격차 확대 가능성",
        "now_what": "단기 (1-2주):\n- GPT-5 기능 분석\n- 현재 AI 전략과 비교\n\n중기 (1-3개월):\n- 파일럿 프로젝트 검토",
        "expert_view": {
          "expert_name": "박태웅",
          "comment": "GPT-5는 단순한 성능 향상이 아닌, 패러다임의 전환입니다. 중요한 것은 이 기술을 어떻게 활용할지에 대한 명확한 전략입니다."
        },
        "relevance_score": 0.95
      }
    ],
    "watch_list": [
      {
        "title": "Google, AI 윤리 가이드라인 업데이트",
        "summary": "기업의 AI 활용 시 준수해야 할 새로운 기준 발표"
      }
    ],
    "recommendations": [
      {
        "type": "event",
        "title": "AI 전략 웨비나",
        "date": "2026-02-20",
        "url": "https://example.com/webinar"
      }
    ],
    "generated_at": "2026-02-16T08:00:00Z"
  }
}
```

### 6.2 브리핑 이력 조회

```http
GET /briefings?start_date=2026-02-01&end_date=2026-02-16
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "briefings": [
      {
        "date": "2026-02-16",
        "summary": "GPT-5 출시, AI 규제 동향",
        "url": "/briefings/2026-02-16"
      },
      {
        "date": "2026-02-15",
        "summary": "클라우드 보안 이슈, 스타트업 투자 동향",
        "url": "/briefings/2026-02-15"
      }
    ],
    "total": 16
  }
}
```

---

## 7. 구독 & 결제

### 7.1 구독 플랜 조회

```http
GET /subscriptions/plans
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "tier": "platinum",
        "name": "Platinum",
        "monthly_fee": 5000000,
        "currency": "KRW",
        "features": [
          "무제한 자문 세션",
          "우선 예약",
          "24/7 AI 어시스턴트",
          "Pre-advisory 무제한",
          "전문가 직접 연락 가능"
        ],
        "booking_discount": "100%"
      },
      {
        "tier": "gold",
        "name": "Gold",
        "monthly_fee": 2000000,
        "currency": "KRW",
        "features": [
          "월 5회 자문 세션",
          "AI 어시스턴트",
          "Pre-advisory 월 10회",
          "일반 예약"
        ],
        "booking_discount": "50%"
      }
    ]
  }
}
```

### 7.2 구독 신청

```http
POST /subscriptions
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "tier": "gold",
  "billing_cycle": "monthly",
  "payment_method_id": "pm_abc123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "subscription_id": "sub_001",
    "user_id": "usr_abc123",
    "tier": "gold",
    "status": "active",
    "monthly_fee": 2000000,
    "billing_cycle": "monthly",
    "start_date": "2026-02-16",
    "next_billing_date": "2026-03-16",
    "created_at": "2026-02-16T10:30:00Z"
  }
}
```

---

## 8. 알림 (Notifications)

### 8.1 알림 목록 조회

```http
GET /notifications?is_read=false&page=1&limit=20
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": "ntf_001",
        "type": "booking_confirmed",
        "title": "자문 예약이 확정되었습니다",
        "message": "박태웅 위원과의 자문이 2026-02-20 10:00에 확정되었습니다.",
        "action_url": "/bookings/bkg_001",
        "is_read": false,
        "priority": "high",
        "sent_at": "2026-02-16T09:45:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_items": 5,
      "per_page": 20
    }
  }
}
```

### 8.2 알림 읽음 처리

```http
PATCH /notifications/{notification_id}/read
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notification_id": "ntf_001",
    "is_read": true,
    "read_at": "2026-02-16T10:35:00Z"
  }
}
```

---

## 9. 에러 코드

| HTTP Status | Error Code | 설명 |
|-------------|-----------|------|
| 400 | `INVALID_REQUEST` | 잘못된 요청 형식 |
| 401 | `UNAUTHORIZED` | 인증 실패 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `RESOURCE_NOT_FOUND` | 리소스를 찾을 수 없음 |
| 409 | `CONFLICT` | 리소스 충돌 (예: 예약 중복) |
| 422 | `VALIDATION_ERROR` | 입력 값 검증 실패 |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate Limit 초과 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |
| 503 | `SERVICE_UNAVAILABLE` | 서비스 일시 중단 |

**에러 응답 예시**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email format is invalid"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "meta": {
    "timestamp": "2026-02-16T10:40:00Z",
    "request_id": "req_xyz789"
  }
}
```

---

## 10. Webhook

### 10.1 Webhook 등록

```http
POST /webhooks
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["booking.confirmed", "booking.completed", "payment.succeeded"],
  "secret": "whsec_abc123"
}
```

### 10.2 Webhook 이벤트

**이벤트 타입**:
- `booking.confirmed`: 예약 확정
- `booking.completed`: 자문 완료
- `booking.cancelled`: 예약 취소
- `payment.succeeded`: 결제 성공
- `payment.failed`: 결제 실패
- `subscription.created`: 구독 시작
- `subscription.cancelled`: 구독 취소

**Payload 예시** (booking.confirmed):
```json
{
  "event_id": "evt_001",
  "event_type": "booking.confirmed",
  "created_at": "2026-02-16T09:45:00Z",
  "data": {
    "booking_id": "bkg_001",
    "user_id": "usr_abc123",
    "speaker_id": "spk_001",
    "scheduled_start": "2026-02-20T10:00:00+09:00"
  }
}
```

---

## 11. API 변경 로그

### v1.0 (2026-02-16)
- 초기 API 릴리스
- 인증, 사용자, 전문가, 예약, 자문, 브리핑, 구독, 알림 엔드포인트 제공

---

**문서 ID**: API-SPEC-2026-001
**작성자**: Garambada | skangbada@gmail.com
