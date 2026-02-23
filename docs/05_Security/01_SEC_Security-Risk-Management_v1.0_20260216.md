# Security & Risk Management Plan
## 보안 및 리스크 관리 계획서

**프로젝트**: AI-Native Speaker Management Pilot System
**문서 버전**: v1.0
**작성일**: 2026-02-16
**작성자**: Garambada

---

## 1. 보안 개요

### 1.1 보안 목표

1. **기밀성 (Confidentiality)**: 경영진 및 전문가의 민감 정보 보호
2. **무결성 (Integrity)**: 데이터 변조 방지 및 정확성 보장
3. **가용성 (Availability)**: 24/7 서비스 가용성 99.9% 이상 유지
4. **책임추적성 (Accountability)**: 모든 액션에 대한 감사 로그

### 1.2 보안 프레임워크

- **NIST AI RMF 1.0** (AI Risk Management Framework)
- **ISO 27001** (정보보안 관리)
- **ISMS-P** (한국 정보보호 및 개인정보보호 관리체계)
- **GDPR** 및 **개인정보보호법** 준수

---

## 2. 보안 아키텍처

### 2.1 계층별 보안

```
┌──────────────────────────────────────┐
│  사용자 계층 (User Layer)             │
│  - MFA (Multi-Factor Authentication) │
│  - Rate Limiting                     │
│  - Device Fingerprinting             │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  네트워크 계층 (Network Layer)         │
│  - TLS 1.3                           │
│  - WAF (Web Application Firewall)    │
│  - DDoS Protection                   │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  애플리케이션 계층 (Application)       │
│  - JWT Token                         │
│  - RBAC (Role-Based Access Control)  │
│  - Input Validation & Sanitization   │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  데이터 계층 (Data Layer)              │
│  - Encryption at Rest (AES-256)      │
│  - Encryption in Transit (TLS 1.3)   │
│  - Database Access Control           │
│  - Backup & Recovery                 │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  인프라 계층 (Infrastructure)          │
│  - VPC Isolation                     │
│  - Security Groups                   │
│  - Secrets Management (Vault)        │
│  - Container Security                │
└──────────────────────────────────────┘
```

### 2.2 AI 특화 보안

#### (1) TEE (Trusted Execution Environment)

```
경영진 민감 질의
    ↓
┌─────────────────────────────────────┐
│   TEE (Intel SGX / AMD SEV)         │
│   - Encrypted Memory                │
│   - Attestation                     │
│   - Secure AI Inference             │
└─────────────────────────────────────┘
    ↓
암호화된 응답
```

**목적**: AI 추론 과정에서도 데이터가 암호화 상태 유지

#### (2) Prompt Injection 방어

```python
def sanitize_user_input(user_query):
    """사용자 입력 검증 및 살균"""

    # 1. 악의적 패턴 탐지
    dangerous_patterns = [
        r"ignore previous instructions",
        r"system:\s*",
        r"<\|im_start\|>",
        r"sudo",
        r"DROP TABLE"
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, user_query, re.IGNORECASE):
            raise SecurityError("Potentially malicious input detected")

    # 2. 길이 제한
    if len(user_query) > 5000:
        raise ValidationError("Input too long")

    # 3. HTML/Script 태그 제거
    sanitized = bleach.clean(user_query)

    return sanitized
```

#### (3) AI 모델 접근 제어

```python
class AIAccessControl:
    """AI 모델 접근 제어"""

    def __init__(self):
        self.tier_limits = {
            "platinum": {"max_tokens": 100000, "models": ["gpt-4", "claude-3"]},
            "gold": {"max_tokens": 50000, "models": ["gpt-4"]},
            "silver": {"max_tokens": 20000, "models": ["gpt-3.5"]},
            "trial": {"max_tokens": 5000, "models": ["gpt-3.5"]}
        }

    def check_access(self, user_tier, requested_model, tokens):
        """접근 권한 확인"""
        tier_config = self.tier_limits.get(user_tier)

        if requested_model not in tier_config["models"]:
            raise PermissionError("Model not available for your tier")

        if tokens > tier_config["max_tokens"]:
            raise QuotaExceededError("Token limit exceeded")

        return True
```

---

## 3. 데이터 보안

### 3.1 데이터 분류

| 등급 | 설명 | 예시 | 보호 수준 |
|------|------|------|----------|
| **Critical** | 최고 민감도 | 경영 전략, 재무 정보 | AES-256 암호화, TEE, 접근 로그 |
| **High** | 높은 민감도 | 개인정보, 자문 내용 | AES-256 암호화, 접근 제어 |
| **Medium** | 중간 민감도 | 예약 정보, 대화 이력 | AES-256 암호화 |
| **Low** | 낮은 민감도 | 공개 콘텐츠, 뉴스 | 암호화 선택 |

### 3.2 암호화 정책

#### (1) Encryption at Rest (저장 데이터 암호화)

```python
from cryptography.fernet import Fernet

class DataEncryption:
    """데이터 암호화"""

    def __init__(self, key):
        self.cipher = Fernet(key)

    def encrypt_field(self, plaintext):
        """필드 레벨 암호화"""
        return self.cipher.encrypt(plaintext.encode()).decode()

    def decrypt_field(self, ciphertext):
        """필드 레벨 복호화"""
        return self.cipher.decrypt(ciphertext.encode()).decode()

# 사용 예시
encryptor = DataEncryption(key=os.getenv("ENCRYPTION_KEY"))

# DB 저장 시
user_data = {
    "email": "ceo@company.com",  # 평문
    "phone": encryptor.encrypt_field("+82-10-1234-5678"),  # 암호화
    "query": encryptor.encrypt_field("AI 전략 관련 자문")  # 암호화
}
```

#### (2) Encryption in Transit (전송 데이터 암호화)

- **TLS 1.3** 강제 사용
- **HSTS (HTTP Strict Transport Security)** 활성화
- **Certificate Pinning** (모바일 앱)

```nginx
# Nginx 설정 예시
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 3.3 데이터 보관 및 삭제

| 데이터 유형 | 보관 기간 | 삭제 방법 |
|------------|----------|----------|
| 사용자 계정 | 탈퇴 후 30일 | Soft Delete → Hard Delete |
| 대화 이력 | 2년 | 자동 아카이빙 → 삭제 |
| 예약 정보 | 완료 후 5년 | 암호화 보관 → 삭제 |
| 결제 정보 | 법정 보관 기간 (5년) | 익명화 → 삭제 |
| 감사 로그 | 7년 | 암호화 아카이빙 |

**Right to be Forgotten (잊혀질 권리) 지원**:
```python
def delete_user_data(user_id):
    """사용자 데이터 완전 삭제"""

    # 1. 개인정보 익명화
    user = User.objects.get(id=user_id)
    user.email = f"deleted_{user_id}@deleted.com"
    user.full_name = "삭제된 사용자"
    user.phone = None
    user.save()

    # 2. 관련 데이터 삭제
    Conversation.objects.filter(user_id=user_id).delete()
    Booking.objects.filter(user_id=user_id).delete()

    # 3. 암호화 키 삭제 (복구 불가능하도록)
    EncryptionKey.objects.filter(user_id=user_id).delete()

    # 4. 감사 로그 기록
    AuditLog.create(
        action="user_data_deleted",
        user_id=user_id,
        timestamp=datetime.now()
    )
```

---

## 4. 인증 & 접근 제어

### 4.1 Multi-Factor Authentication (MFA)

**필수 대상**: Platinum 및 Gold 티어 사용자

**지원 방식**:
1. SMS OTP
2. TOTP (Google Authenticator, Authy)
3. 생체 인증 (모바일 앱)

```python
def verify_mfa(user_id, otp_code):
    """MFA 검증"""

    user = User.objects.get(id=user_id)

    # TOTP 검증
    totp = pyotp.TOTP(user.mfa_secret)

    if totp.verify(otp_code, valid_window=1):
        return True
    else:
        # 실패 횟수 증가
        user.mfa_failed_attempts += 1

        # 5회 실패 시 계정 잠금
        if user.mfa_failed_attempts >= 5:
            user.is_locked = True
            send_security_alert(user, "Multiple MFA failures")

        user.save()
        return False
```

### 4.2 Role-Based Access Control (RBAC)

| 역할 | 권한 |
|------|------|
| **Executive** | 자문 예약, AI 어시스턴트 사용, 브리핑 조회 |
| **Admin** | 모든 사용자 관리, 시스템 설정 |
| **Speaker** | 예약 관리, 콘텐츠 업로드 |
| **Guest** | 제한된 조회 권한 |

```python
from functools import wraps

def require_role(allowed_roles):
    """역할 기반 접근 제어 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = get_current_user()

            if user.role not in allowed_roles:
                raise PermissionError(f"Access denied for role: {user.role}")

            return func(*args, **kwargs)
        return wrapper
    return decorator

# 사용 예시
@require_role(["executive", "admin"])
def book_speaker(speaker_id, datetime):
    """전문가 예약"""
    pass
```

### 4.3 API 키 관리

**Secrets Management** (HashiCorp Vault 사용):

```python
import hvac

def get_secret(secret_path):
    """Vault에서 시크릿 조회"""

    client = hvac.Client(url=os.getenv("VAULT_ADDR"))
    client.token = os.getenv("VAULT_TOKEN")

    secret = client.secrets.kv.v2.read_secret_version(
        path=secret_path
    )

    return secret['data']['data']

# 사용 예시
db_password = get_secret("database/postgres")["password"]
openai_api_key = get_secret("ai/openai")["api_key"]
```

---

## 5. 네트워크 보안

### 5.1 WAF (Web Application Firewall) 규칙

**AWS WAF 또는 Cloudflare WAF 사용**:

```json
{
  "rules": [
    {
      "name": "BlockSQLInjection",
      "priority": 1,
      "action": "BLOCK",
      "statement": {
        "sqliMatchStatement": {
          "fieldToMatch": {
            "allQueryArguments": {}
          }
        }
      }
    },
    {
      "name": "BlockXSS",
      "priority": 2,
      "action": "BLOCK",
      "statement": {
        "xssMatchStatement": {
          "fieldToMatch": {
            "body": {}
          }
        }
      }
    },
    {
      "name": "RateLimitPerIP",
      "priority": 3,
      "action": "BLOCK",
      "statement": {
        "rateBasedStatement": {
          "limit": 2000,
          "aggregateKeyType": "IP"
        }
      }
    }
  ]
}
```

### 5.2 DDoS 방어

- **Cloudflare DDoS Protection** 또는 **AWS Shield Advanced**
- **Rate Limiting**: IP별, 사용자별 요청 제한
- **CAPTCHA**: 의심스러운 트래픽에 대해 챌린지

```python
from functools import wraps
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def rate_limit(max_requests=100, window_seconds=3600):
    """Rate Limiting 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user_id = get_current_user().id
            key = f"rate_limit:{user_id}:{func.__name__}"

            current = redis_client.incr(key)

            if current == 1:
                redis_client.expire(key, window_seconds)

            if current > max_requests:
                raise RateLimitExceeded(
                    f"Rate limit exceeded: {current}/{max_requests} requests"
                )

            return func(*args, **kwargs)
        return wrapper
    return decorator

# 사용 예시
@rate_limit(max_requests=100, window_seconds=3600)
def create_booking(speaker_id, datetime):
    """예약 생성"""
    pass
```

---

## 6. 애플리케이션 보안

### 6.1 OWASP Top 10 대응

| 위협 | 대응 방안 |
|------|----------|
| **Injection** | Parameterized Queries, ORM 사용, Input Validation |
| **Broken Authentication** | MFA, JWT with short expiry, Password Policy |
| **Sensitive Data Exposure** | AES-256 암호화, TLS 1.3 |
| **XML External Entities (XXE)** | XML Parser 안전 설정 |
| **Broken Access Control** | RBAC, 최소 권한 원칙 |
| **Security Misconfiguration** | 기본 설정 변경, 불필요한 서비스 비활성화 |
| **XSS** | Input Sanitization, CSP 헤더 |
| **Insecure Deserialization** | 신뢰할 수 없는 데이터 역직렬화 금지 |
| **Components with Known Vulnerabilities** | 정기적인 패키지 업데이트, Dependabot |
| **Insufficient Logging** | 모든 액션 로깅, SIEM 연동 |

### 6.2 Content Security Policy (CSP)

```http
Content-Security-Policy:
    default-src 'self';
    script-src 'self' https://cdn.boardroomclub.ai;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://cdn.boardroomclub.ai;
    connect-src 'self' https://api.boardroomclub.ai;
    frame-ancestors 'none';
```

### 6.3 Dependency 관리

**정기적인 취약점 스캔**:

```bash
# Python Dependencies
pip-audit

# Node.js Dependencies
npm audit

# Docker Images
trivy image my-app:latest
```

**자동화된 업데이트**:
- **Dependabot** (GitHub)
- **Renovate Bot**

---

## 7. 모니터링 & 감사

### 7.1 보안 이벤트 로깅

**로깅 대상**:
- 모든 인증 시도 (성공/실패)
- API 호출 (사용자, 엔드포인트, 응답 코드)
- 데이터 접근 (누가, 언제, 무엇을)
- 권한 변경
- 보안 설정 변경

```python
def log_security_event(event_type, user_id, details):
    """보안 이벤트 로깅"""

    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "details": details
    }

    # 로그 저장 (DB + 파일)
    SecurityLog.create(**log_entry)

    # 고위험 이벤트는 즉시 알림
    if event_type in ["multiple_login_failures", "unauthorized_access"]:
        send_alert_to_security_team(log_entry)
```

### 7.2 이상 탐지

**AI 기반 이상 행동 탐지**:

```python
def detect_anomaly(user_id, action):
    """이상 행동 탐지"""

    # 1. 사용자 행동 패턴 조회
    user_pattern = UserBehaviorProfile.get(user_id)

    # 2. 현재 액션과 비교
    anomaly_score = calculate_anomaly_score(action, user_pattern)

    # 3. 임계값 초과 시 알림
    if anomaly_score > 0.8:
        alert = {
            "user_id": user_id,
            "action": action,
            "anomaly_score": anomaly_score,
            "reason": "Unusual activity detected"
        }

        # 보안팀 알림
        send_security_alert(alert)

        # 추가 인증 요구
        require_additional_authentication(user_id)
```

### 7.3 SIEM 연동

- **Splunk** 또는 **Elastic Security** 사용
- 실시간 로그 분석 및 상관관계 분석
- 자동화된 인시던트 대응

---

## 8. 리스크 관리

### 8.1 리스크 평가 매트릭스

| 리스크 | 확률 | 영향도 | 위험도 | 대응 전략 |
|--------|------|--------|--------|----------|
| **데이터 유출** | 낮음 | 높음 | **높음** | 암호화, 접근 제어, 정기 감사 |
| **AI 모델 악용** | 중간 | 중간 | **중간** | Prompt injection 방어, Rate limiting |
| **DDoS 공격** | 중간 | 중간 | **중간** | CDN, WAF, 트래픽 모니터링 |
| **내부자 위협** | 낮음 | 높음 | **중간** | RBAC, 감사 로그, 배경 조사 |
| **공급망 공격** | 낮음 | 높음 | **중간** | Dependency 스캔, SBOMSoftware Bill of Materials) |
| **서비스 중단** | 중간 | 높음 | **높음** | 이중화, 백업, DR 계획 |

### 8.2 인시던트 대응 절차

```
사고 발생
    ↓
┌─────────────────────────────────────┐
│ 1. 탐지 & 분석 (Detection)          │
│    - 로그 분석                       │
│    - 영향 범위 파악                  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. 격리 (Containment)               │
│    - 공격자 차단                     │
│    - 영향받은 시스템 격리            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. 제거 (Eradication)               │
│    - 악성 코드 제거                  │
│    - 취약점 패치                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. 복구 (Recovery)                  │
│    - 시스템 재가동                   │
│    - 데이터 복구                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. 사후 분석 (Post-Incident)        │
│    - 근본 원인 분석                  │
│    - 재발 방지 대책 수립             │
└─────────────────────────────────────┘
```

### 8.3 비상 연락망

| 역할 | 이름 | 연락처 | 책임 |
|------|------|--------|------|
| **보안 책임자** | TBD | 010-XXXX-XXXX | 전체 보안 총괄 |
| **시스템 관리자** | TBD | 010-XXXX-XXXX | 인프라 복구 |
| **개발 리드** | TBD | 010-XXXX-XXXX | 애플리케이션 패치 |
| **법무 담당** | TBD | 010-XXXX-XXXX | 법적 대응 |

---

## 9. 컴플라이언스

### 9.1 개인정보보호법 준수

**필수 조치**:
- ✅ 개인정보 처리방침 게시
- ✅ 동의 획득 (명시적, 선택적)
- ✅ 개인정보 처리 위탁 고지
- ✅ 열람/정정/삭제 요구권 보장
- ✅ 파기 절차 수립
- ✅ 개인정보보호책임자 지정

### 9.2 NIST AI RMF 준수

| 기능 | 요구사항 | 구현 상태 |
|------|----------|-----------|
| **Govern** | AI 거버넌스 체계 수립 | ✅ AI 윤리 정책 문서화 |
| **Map** | AI 리스크 식별 | ✅ 리스크 평가 매트릭스 |
| **Measure** | AI 성능 및 리스크 측정 | ✅ 모델 평가 지표 정의 |
| **Manage** | AI 리스크 관리 | ✅ 인시던트 대응 절차 |

### 9.3 정기 감사

| 감사 유형 | 주기 | 담당 |
|----------|------|------|
| **내부 보안 감사** | 분기 1회 | 보안팀 |
| **외부 침투 테스트** | 연 2회 | 외부 전문 업체 |
| **컴플라이언스 점검** | 연 1회 | 법무팀 + 외부 감사인 |
| **AI 모델 편향성 평가** | 반기 1회 | AI 윤리위원회 |

---

## 10. 보안 교육

### 10.1 직원 교육 프로그램

| 대상 | 교육 내용 | 주기 |
|------|----------|------|
| **전 직원** | 정보보안 기본, 피싱 대응 | 연 2회 |
| **개발팀** | Secure Coding, OWASP Top 10 | 분기 1회 |
| **AI 팀** | AI 윤리, Prompt Injection 방어 | 반기 1회 |
| **경영진** | 보안 전략, 컴플라이언스 | 연 1회 |

### 10.2 보안 인식 제고

- **모의 훈련**: 연 2회 모의 침투 테스트
- **피싱 시뮬레이션**: 월 1회 무작위 피싱 메일 발송
- **보안 뉴스레터**: 주 1회 최신 보안 이슈 공유

---

## 11. 백업 및 재해 복구

### 11.1 백업 전략

| 데이터 | 백업 주기 | 보관 기간 | 백업 위치 |
|--------|----------|----------|----------|
| **PostgreSQL** | 일 1회 (증분), 주 1회 (전체) | 30일 | S3 (다른 리전) |
| **Vector DB** | 일 1회 스냅샷 | 30일 | S3 |
| **Neo4j** | 일 1회 | 30일 | S3 |
| **파일 스토리지** | 실시간 복제 | 90일 | S3 (다른 리전) |

### 11.2 DR (Disaster Recovery) 계획

**목표**:
- **RTO (Recovery Time Objective)**: 4시간
- **RPO (Recovery Point Objective)**: 1시간

**재해 복구 절차**:
1. **재해 선언**: 보안 책임자 승인
2. **DR 사이트 활성화**: 대기 중인 인프라 가동
3. **데이터 복구**: 최신 백업에서 복원
4. **서비스 전환**: DNS 업데이트, 트래픽 라우팅
5. **검증**: 기능 테스트 및 데이터 무결성 확인

---

## 12. 보안 로드맵

### Phase 1: 기본 보안 (Month 1-2)
- TLS 1.3 적용
- JWT 인증 구현
- AES-256 암호화
- Rate Limiting

### Phase 2: 고급 보안 (Month 3-4)
- MFA 도입
- WAF 설정
- SIEM 연동
- 정기 보안 스캔

### Phase 3: AI 보안 (Month 5)
- TEE 구현
- Prompt Injection 방어
- AI 모델 접근 제어
- 편향성 평가

### Phase 4: 컴플라이언스 (Month 6)
- ISMS-P 인증 준비
- ISO 27001 인증
- 외부 침투 테스트

---

**문서 ID**: SEC-RISK-2026-001
**작성자**: Garambada | skangbada@gmail.com
