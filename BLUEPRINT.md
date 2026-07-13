# ☕ 카페 앱 - 프로젝트 청사진

## 📁 폴더 구조 (완전 코로케이션)

```
cafe-app/
│
├── index.html                        # 메인 (고객)
├── index.css                         # 메인 페이지 스타일
└── index.js                          # 메인 페이지 로직
│
├── 👤 고객 - 로그인/회원가입 (audio-shop 참고)
│   └── auth/
│       ├── login.html                # 로그인
│       ├── login.css
│       ├── login.js
│       ├── signup.html               # 회원가입
│       ├── signup.css
│       └── signup.js
│
├── 👤 고객 - 메뉴
│   └── menus/
│       ├── list.html                 # 메뉴 목록
│       ├── list.css
│       ├── list.js
│       ├── detail.html               # 메뉴 상세
│       ├── detail.css
│       └── detail.js
│
├── 👤 고객 - 마이페이지
│   └── my/
│       ├── index.html                # 마이페이지 메인
│       ├── index.css
│       └── index.js
│
├── 👤 고객 - 장바구니
│   └── basket/
│       ├── list.html                 # 장바구니
│       ├── list.css
│       └── list.js
│
├── 👤 고객 - 주문 내역
│   └── orders/
│       ├── list.html                 # 주문 내역 목록
│       ├── list.css
│       ├── list.js
│       ├── detail.html               # 주문 상세
│       ├── detail.css
│       └── detail.js                   
│
├── 🔴 관리자/사장
│   └── admin/
│       ├── login.html                # 관리자 로그인 (audio-shop 참고)
│       ├── login.css
│       ├── login.js
│       ├── index.html                # 대시보드
│       ├── index.css
│       ├── index.js
│       │
│       ├── menus/
│       │   ├── list.html             # 메뉴 목록
│       │   ├── list.css
│       │   ├── list.js
│       │   ├── detail.html           # 메뉴 상세
│       │   ├── detail.css
│       │   ├── detail.js
│       │   ├── create.html           # 메뉴 추가
│       │   ├── create.css
│       │   ├── create.js
│       │   ├── edit.html             # 메뉴 수정
│       │   ├── edit.css
│       │   └── edit.js
│       │
│       └── orders/
│           ├── list.html             # 주문 목록
│           ├── list.css
│           ├── list.js
│           ├── detail.html           # 주문 상세
│           ├── detail.css
│           └── detail.js
│
├── 📦 공유 자원
│   ├── css/
│   │   └── variables.css             # CSS 변수 (전역)
│   └── js/
│       ├── data.js                   # 메뉴/카테고리 데이터
│       └── utils.js                  # 공통 유틸리티
```

## 👥 역할별 기능

| 역할 | 경로 | 주요 기능 |
|------|------|-----------|
| **고객** | `/`, `/auth/`, `/menus/`, `/my/`, `/basket/`, `/orders/` | 메인, 로그인/회원가입, 메뉴 조회, 마이페이지, 장바구니, 주문 내역 |
| **관리자/사장** | `/admin/login`, `/admin/`, `/admin/menus/`, `/admin/orders/` | 관리자 로그인, 대시보드, 메뉴 CRUD, 주문 관리 |

## 🔑 로그인 (audio-shop 참고)

- **저장 방식**: 별도 백엔드 없이 localStorage 기반 인증 (`cafeapp_users`, `cafeapp_session`, `cafeapp_admin`, `cafeapp_admin_session`).
- **고객**: `auth/signup`에서 회원가입(이메일/비밀번호/이름) → `auth/login`에서 로그인 → `cafeapp_session`에 로그인 정보 저장.
- **관리자**: `admin/login`에서 로그인 → `cafeapp_admin_session`에 저장. 관리자 계정은 시드 데이터로 미리 하나 심어둠(예: `admin@cafe.com` / `admin1234`).
- **접근 제어**: `my/`, `admin/`(로그인 페이지 제외) 등 로그인이 필요한 페이지는 세션이 없으면 각각 `auth/login`, `admin/login`으로 리다이렉트.
- **로그아웃**: 헤더 내비게이션에 로그아웃 버튼 추가, 클릭 시 세션 키 삭제 후 메인으로 이동.

## 🎨 디자인

- **테마**: 라이트 + 따뜻한 브라운/크림 톤
- **분위기**: 미니멀 + 모던
- **카드 스타일**: Glass morphism
- **레이아웃**: 반응형 (모바일/데스크톱)

## 📐 코로케이션 원칙

- **HTML과 동일한 디렉토리에 css, js 파일을 평탄하게 배치** (별도 하위 폴더 없음)
- **파일명은 HTML 파일명과 동일하게 매칭** (`index.html` → `index.css`, `index.js`)
- 전역 공통 자원만 `/css/`, `/js/` 폴더에 분리
- 역할별 독립 폴더로 관심사를 분리

---

## ✅ 구현 TODO

### 1단계: 공유 자원

- [ ] `css/variables.css` — 전역 CSS 변수, 리셋
- [ ] `js/data.js` — 메뉴/카테고리 데이터
- [ ] `js/utils.js` — 공통 유틸리티 (카트, 포맷 등)

### 2단계: 관리자 - 메뉴 관리 시스템

- [ ] `admin/menus/list.html` — 메뉴 목록
- [ ] `admin/menus/list.css`
- [ ] `admin/menus/list.js`
- [ ] `admin/menus/detail.html` — 메뉴 상세
- [ ] `admin/menus/detail.css`
- [ ] `admin/menus/detail.js`
- [ ] `admin/menus/create.html` — 메뉴 추가
- [ ] `admin/menus/create.css`
- [ ] `admin/menus/create.js`
- [ ] `admin/menus/edit.html` — 메뉴 수정
- [ ] `admin/menus/edit.css`
- [ ] `admin/menus/edit.js`

### 3단계: 고객 - 메뉴 조회 시스템

- [ ] `menus/list.html` — 메뉴 목록
- [ ] `menus/list.css`
- [ ] `menus/list.js`
- [ ] `menus/detail.html` — 메뉴 상세
- [ ] `menus/detail.css`
- [ ] `menus/detail.js`

### 4단계: 고객 - 장바구니 관리 시스템

- [ ] `basket/list.html` — 장바구니
- [ ] `basket/list.css`
- [ ] `basket/list.js`

### 5단계: 고객 - 주문 관리 시스템

- [ ] `orders/list.html` — 주문 내역 목록
- [ ] `orders/list.css`
- [ ] `orders/list.js`
- [ ] `orders/detail.html` — 주문 상세
- [ ] `orders/detail.css`
- [ ] `orders/detail.js`

### 6단계: 고객 - 메인 페이지

- [ ] `index.html`
- [ ] `index.css`
- [ ] `index.js`

### 7단계: 고객 - 마이페이지

- [ ] `my/index.html`
- [ ] `my/index.css`
- [ ] `my/index.js`

### 8단계: 관리자 - 대시보드 & 주문 관리

- [ ] `admin/index.html` — 대시보드
- [ ] `admin/index.css`
- [ ] `admin/index.js`
- [ ] `admin/orders/list.html` — 주문 목록
- [ ] `admin/orders/list.css`
- [ ] `admin/orders/list.js`
- [ ] `admin/orders/detail.html` — 주문 상세
- [ ] `admin/orders/detail.css`
- [ ] `admin/orders/detail.js`

### 9단계: 고객/관리자 - 로그인 (audio-shop 참고)

- [ ] `js/utils.js` — `cafeapp_users`, `cafeapp_session`, `cafeapp_admin`, `cafeapp_admin_session` 키와 인증 관련 헬퍼 함수 추가
- [ ] `auth/login.html/css/js` — 고객 로그인
- [ ] `auth/signup.html/css/js` — 고객 회원가입
- [ ] `admin/login.html/css/js` — 관리자 로그인 (관리자 시드 계정 하나 포함)
- [ ] `my/index.js`, `admin/index.js` 등 — 로그인 필요한 페이지에 세션 체크 및 리다이렉트 적용
- [ ] 헤더 내비게이션에 로그인 상태에 따른 로그인/로그아웃 버튼 전환

### 10단계: 고객 - 메뉴 목록 UX 개선 (audio-shop 참고)

- [ ] `menus/list.html/css/js` — 정렬(기본순/가격순) 옆에 그리드보기/목록보기 전환 버튼 추가
- [ ] `menus/list.html/css/js` — 메뉴 카드에 바로 담기 버튼 + 바로 주문 버튼 추가
- [ ] `menus/list.css` — 목록보기 모드에서도 그리드보기와 동일하게 카드 호버 확대 효과 적용

### 11단계: 고객 - 메뉴 상세 페이지 리디자인 (audio-shop 참고)

- [ ] `menus/detail.html/css/js` — 이미지+정보 2단 레이아웃으로 리디자인 (기존 헤더 내비게이션 스타일은 유지)
- [ ] `menus/detail.html/css/js` — 담기 완료 모달, 바로 주문 버튼 추가

### 12단계: 고객 - 결제 수단 선택 (audio-shop 참고)

- [ ] `basket/list.html/css/js` — 결제 시 결제 수단 선택 UI 추가 (카드 / 간편결제: 네이버페이, 카카오페이)

### 13단계: 관리자 - 메뉴/주문 관리 UX 개선 (audio-shop 참고)

- [ ] `admin/menus/list.html/css/js` — 그리드보기/목록보기 전환 버튼 추가
- [ ] `admin/menus/list.css`, `admin/orders/list.css` — 행/카드에 커서를 올렸을 때 테두리 강조 효과 추가
- [ ] `admin/menus/list.js`, `admin/orders/list.js` — 행/카드 클릭 시 상세 페이지로 이동 (버튼·링크 클릭은 제외)

### 14단계: 공통 - 레이아웃 점검 (audio-shop 참고)

- [ ] 전 페이지 `.page` 등 중앙 정렬이 필요한 컨테이너에 `margin: 0 auto` 적용 여부 점검
- [ ] `hidden` 속성으로 토글되는 요소에 `display: grid/flex` 등이 걸려 있는 경우 `[hidden] { display: none; }` 오버라이드 규칙 추가 (CSS 우선순위 충돌로 실제로는 안 숨겨지는 버그 방지)
