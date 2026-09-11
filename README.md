# 관리 콘솔 연습 시뮬레이터

교사 연수용 **가짜 Google Workspace 관리 콘솔**입니다. 실제 admin.google.com 화면을 최대한 비슷하게 재현했고,
무엇을 눌러도 실제 조직 설정은 바뀌지 않습니다. (변경 내용은 브라우저 localStorage에만 저장)

👉 **https://shussamsujin.github.io/admin-practice-simulator/**

## 두 가지 권한 모드

| 모드 | 계정 | 보이는 메뉴 |
|---|---|---|
| **센스쿨** (기본) | admin@school.sen.ms.kr | 홈 · 디렉터리 · 기기 · 보안 · 데이터 · 규칙 — senedu.kr 학교 관리자에게 위임된 범위 |
| **최고관리자** | superadmin@school.sen.ms.kr | 위 메뉴 + Chrome 브라우저 · 앱 · 생성형 AI · 에이전트 · 보고 · 결제 · 계정 · 저장용량 |

- 시작 화면에서 계정을 고르거나, 콘솔 **상단 오른쪽 토글**로 언제든 전환할 수 있습니다.
- 센스쿨 모드에서 권한 밖 주소로 들어가면 "이 계정에는 권한이 없습니다" 안내가 나옵니다.
  연수 중 *"우리 학교 계정에는 왜 이 메뉴가 없나요?"* 를 화면으로 바로 보여줄 수 있습니다.

## 연습할 수 있는 것

- 조직 단위 · 사용자 · 그룹 만들기/삭제 (연습 데이터). 조직 단위는 학년별 하위 OU까지 트리로 구성
- **기기 > Chrome** 아래 실제 콘솔과 같은 3단계 메뉴(설정 가이드 · 기기 · 등록 토큰 · 관리 브라우저 · 설정 · 앱 및 확장 프로그램 · 웹 기능 · 커넥터 · 프린터 · 보고서)
- Chrome **사용자 및 브라우저 설정 / 기기 설정 / 관리 게스트 세션 설정** 정책 전체 — 실제 콘솔 카탈로그를 그대로 옮겼습니다
- **화면에 보이는 설정값은 거의 다 클릭해서 바꿀 수 있습니다.** 값에 마우스를 올리면 연필 아이콘이 뜨고, 누르면 실제 콘솔과 같은 편집 다이얼로그가 열립니다. 바꾼 값은 `변경됨` 표시와 함께 조직 단위별로 저장됩니다.
- 앱 및 확장 프로그램, Workspace 서비스별 설정(Gmail, Meet, Classroom, Drive, Calendar …), 추가 Google 서비스, Marketplace 앱, 생성형 AI(Gemini) 설정
- 조직 단위(OU)를 바꿔 가며 정책이 어디에 적용되는지 확인

초기 상태로 되돌리려면 브라우저 개발자도구 콘솔에서 `localStorage.clear()` 후 새로고침하세요.

## 구조 (빌드 없음, 순수 정적)

```
index.html
assets/css/console.css   셸·홈 등 관리 콘솔 외형
assets/css/pages.css     세부 페이지 스타일
assets/js/app.js         상태·라우팅(해시)·공용 부품(OU 트리, 정책 표, 모달)
assets/js/nav.js         사이드바 구성 + 모드별 노출 규칙
assets/js/views/*.js     화면별 렌더 모듈
assets/js/data/*.js      Chrome 정책 카탈로그
```

로컬 확인: `python -m http.server 8000` 후 `http://localhost:8000`

---

비공식 교육용 시뮬레이터입니다. Google LLC와 제휴하거나 Google이 승인한 서비스가 아닙니다.

© Google Certified Trainer & Innovator Sujin Lee · 문의 gajungssamzzang@gmail.com
