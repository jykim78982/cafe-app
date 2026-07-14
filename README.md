# ☕ 카페 앱

카페 메뉴를 둘러보고 주문할 수 있는 웹앱입니다. 빌드 도구나 프레임워크 없이 순수 HTML/CSS/JavaScript로 만들었고, 데이터 저장·인증·이미지 업로드는 [Supabase](https://supabase.com)(Postgres, Auth, Storage)를 사용합니다.

## 기술 스택

- **Frontend**: Vanilla HTML / CSS / JavaScript (빌드 도구 없음, `<script>` 태그로 직접 로드)
- **Backend**: Supabase — Postgres Database, Auth, Storage
- **접근 제어**: Row Level Security(RLS) + `app_metadata.role`로 관리자 구분
- **로컬 서버**: [`serve`](https://www.npmjs.com/package/serve) (정적 파일 서빙용)

## 시작하기

```bash
npm install
npm start
```

`http://localhost:3132`에서 확인할 수 있습니다.

> Supabase 프로젝트 연결 정보(URL, publishable key)는 `js/supabaseClient.js`에 이미 설정되어 있어 별도 환경변수 설정 없이 바로 동작합니다.

## 폴더 구조

코로케이션 원칙에 따라 HTML과 같은 디렉토리에 CSS·JS를 평탄하게 둡니다 (별도 하위 폴더 없음).

```
cafe-app/
├── index.html / index.css / index.js       # 메인 페이지
├── auth/          # 로그인, 회원가입 (고객·관리자 공용)
├── menus/         # 고객 - 메뉴 목록/상세
├── basket/        # 고객 - 장바구니, 결제
├── orders/        # 고객 - 주문 내역/상세
├── my/            # 고객 - 마이페이지
├── admin/         # 관리자 - 대시보드
│   ├── menus/     # 메뉴 CRUD (등록/수정/상세/목록)
│   └── orders/    # 주문 관리
├── css/variables.css   # 전역 CSS 변수/리셋
├── js/
│   ├── supabaseClient.js  # Supabase 클라이언트 초기화
│   ├── data.js             # 메뉴/주문 데이터 레이어 (CafeData)
│   └── utils.js            # 장바구니, 인증, 공통 유틸 (CafeUtils)
└── images/, assets/    # 정적 이미지·영상
```

자세한 구현 단계는 [BLUEPRINT.md](./BLUEPRINT.md)를 참고하세요.

## 주요 기능

### 고객

- 비로그인 상태로도 메뉴 조회, 장바구니 담기, 결제(게스트 체크아웃) 가능
- 회원가입/로그인(Supabase Auth), 로그인 시 주문 내역 조회·취소
- 결제 수단 선택(카드/네이버페이/카카오페이, 모의 결제)

### 관리자

- `app_metadata.role = 'admin'`으로 구분되는 관리자 계정으로 로그인
- 메뉴 등록/수정/삭제, 품절 처리
- 메뉴 사진 실제 업로드(Supabase Storage) — 업로드 전 자동 리사이즈/압축
- 사진 클릭 → 드래그로 보여줄 영역(크롭 위치) 직접 지정
- 주문 목록 조회 및 상태 변경(접수 → 준비중 → 완료/취소)

## 데이터 모델 (Supabase)

- `menus` — 메뉴 정보 (이름, 카테고리, 가격, 설명, 이미지, 크롭 위치, 품절 여부)
- `orders` — 주문 정보 (`user_id`는 로그인 사용자만, 게스트는 `null`), 상태·결제수단·금액·주문 항목(jsonb)
- `menu-images` Storage 버킷 — 관리자만 업로드 가능한 public 버킷
- 게스트 주문 조회/취소는 `get_guest_order` / `cancel_guest_order` RPC로 제한적으로 허용

## Supabase 작업 시 참고

이 프로젝트 루트의 `.mcp.json`에 Supabase MCP 서버가 연결되어 있어, **이 폴더를 워크스페이스로 연 상태**에서만 Claude Code가 스키마 변경·RLS 정책·마이그레이션 등의 Supabase 작업을 수행할 수 있습니다.
