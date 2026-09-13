// 담당 범위: "앱(Apps)" 섹션 — 개요 / Google Workspace 서비스별 설정 / 추가 Google 서비스 / 웹 및 모바일 앱 / Marketplace 앱 / LDAP
// (원본 app/page.tsx 85-115, 650-943 줄의 AppsSectionView 계열 컴포넌트 포팅)
// 모든 상태/설정 값은 ctx.editable 로 감싸 클릭해서 바꿀 수 있게 했다.

const WORKSPACE_NESTED = [
  '서비스 상태','검토','AppSheet','Calendar','Chrome 동기화','Classroom','Drive 및 Docs','Gmail',
  'Google Meet','Google Vault','Google Voice','Google Workspace LTI™','Google Chat','Groups for Business',
  'Keep','Read Along','Sites','Workspace Studio','Tasks',
];

const EXTRA_GOOGLE_SERVICES = [
  { name:'AI Studio', status:'사용', needConfirm:true },
  { name:'Colab', status:'사용', needConfirm:true },
  { name:'Chrome 웹 스토어', status:'사용', needConfirm:false },
  { name:'Blogger', status:'사용', needConfirm:false },
  { name:'Google Ads', status:'사용 안함', needConfirm:true },
  { name:'Google Analytics', status:'사용', needConfirm:false },
  { name:'Google Cloud Platform', status:'사용', needConfirm:true },
  { name:'Google Pay', status:'사용 안함', needConfirm:false },
  { name:'Google 검색 콘솔', status:'사용', needConfirm:false },
  { name:'Looker Studio', status:'사용', needConfirm:true },
  { name:'Managed Google Play', status:'사용', needConfirm:false },
  { name:'YouTube', status:'사용', needConfirm:false },
];

const MARKETPLACE_APPS = [
  { name:'Canva', publisher:'Canva Pty Ltd', status:'배포됨', users:'전체' },
  { name:'DocHub', publisher:'DocHub', status:'배포됨', users:'교원' },
  { name:'Kahoot!', publisher:'Kahoot!', status:'허용', users:'전체' },
  { name:'Kami', publisher:'Amazing Widgets', status:'배포됨', users:'전체' },
  { name:'Nearpod', publisher:'Nearpod Inc.', status:'허용', users:'교원' },
  { name:'두클래스', publisher:'두클래스', status:'배포됨', users:'전체' },
  { name:'Pear Deck', publisher:'Pear Deck', status:'허용', users:'교원' },
  { name:'Quizizz', publisher:'Quizizz Inc.', status:'허용', users:'전체' },
];

const OU_CHILDREN = ['1.관리자','2.교원','3.학생','4.태블릿기기','5.크롬북(삭제금지)'];

/* ── 값 편집 헬퍼 ─────────────────────────────────────────────── */

const SERVICE_STATUS_OPTIONS = ['모든 사용자에게 사용', '모든 사용자에게 사용 중지', '일부 조직 단위에만 사용'];
const MARKETPLACE_STATUS_OPTIONS = ['배포됨', '허용', '차단', '설치 요청 대기'];
const MARKETPLACE_USER_OPTIONS = ['전체', '교원', '학생', '교원·학생', '배포 안함'];
const REVIEW_OPTIONS = ['확인 필요', '검토 완료', '조치 필요 없음'];
const OU_OPTIONS = ['연습학교'].concat(OU_CHILDREN);

// 값은 조직 단위별로 따로 저장한다.
function scopeOf(ctx) {
  const ou = typeof ctx.currentOu === 'function' ? ctx.currentOu() : currentOu(ctx);
  return `apps:${ou}`;
}

// 값 형태를 보고 그럴듯한 선택지를 만든다.
function autoOptions(value) {
  const v = String(value == null ? '' : value);
  if (v === '사용') return ['사용', '사용 안함', '사용자가 결정하도록 허용'];
  if (v === '사용 안함') return ['사용 안함', '사용', '사용자가 결정하도록 허용'];
  if (v === '허용') return ['허용', '허용 안함', '일부 조직 단위만 허용'];
  if (v === '허용 안함') return ['허용 안함', '허용', '일부 조직 단위만 허용'];
  return [v, '사용', '사용 안함', 'Google 기본값 사용'].filter((x, i, a) => x && a.indexOf(x) === i);
}

// 값 색상(초록/회색) 자동 판정
function autoClass(value) {
  const v = String(value == null ? '' : value);
  if (/사용 안함|사용 중지|허용 안함|차단|사용하지 않음|제한됨|배포 안함/.test(v)) return 'status-off';
  if (/사용|허용|유효|인증됨|강화됨|필요 없음|배포됨/.test(v)) return 'status-on';
  return '';
}

function current(ctx, name, fallback) {
  return typeof ctx.setting === 'function' ? ctx.setting(scopeOf(ctx), name, fallback) : fallback;
}

/** 클릭해서 바꿀 수 있는 값 버튼 */
function ed(ctx, name, value, options, className) {
  const cls = className === undefined ? autoClass(current(ctx, name, value)) : className;
  return ctx.editable({
    scope: scopeOf(ctx),
    name,
    value,
    options: options && options.length ? options : autoOptions(value),
    section: String(name).split(' · ')[0],
    className: cls,
  });
}

/* ── 공용 헬퍼 ───────────────────────────────────────────────── */

// 원본 AppliedOu(). ctx.appliedOu() 가 있으면 그것을 쓰고, 없으면 동일 마크업을 직접 낸다.
function appliedOu(ctx) {
  if (typeof ctx.appliedOu === 'function') return ctx.appliedOu();
  return `<small class="applied-ou">&apos;연습학교&apos;에 적용됨</small>`;
}

function crumb(ctx, text) {
  if (typeof ctx.crumb === 'function') return ctx.crumb(text);
  return `<div class="page-crumb">${ctx.esc(text)}</div>`;
}

// 원본 AccordionCard(React useState) → <details>/<summary> 로 대체.
// 클릭하면 브라우저가 직접 펼치므로 리렌더가 필요 없다(= 펼침 상태가 유지된다).
function accordion(ctx, { title, desc, open, body }) {
  return `<details class="settings-card accordion-card"${open ? ' open' : ''}>`
    + `<summary><div><h2>${ctx.esc(title)}</h2>${desc ? `<p>${ctx.esc(desc)}</p>` : ''}</div>`
    + `${ctx.icon('expand_more', 18)}</summary>`
    + `<div class="accordion-body">${body || ''}${appliedOu(ctx)}</div>`
    + `</details>`;
}

// 서비스 상태 카드 본문 (앱 이름으로 구분된 편집 가능한 값)
function statusKv(ctx, app) {
  return `<div class="card-kv"><strong>상태</strong>`
    + ed(ctx, `${app} · 서비스 상태`, '모든 사용자에게 사용', SERVICE_STATUS_OPTIONS)
    + `</div>`;
}

function kv(ctx, label, value, name, options, className) {
  return `<div class="card-kv"><strong>${ctx.esc(label)}</strong>`
    + ed(ctx, name, value, options, className)
    + `</div>`;
}

// [[이름, 값, 선택지?], ...] → .settings-card-grid
function grid(ctx, pairs, prefix) {
  return `<div class="settings-card-grid">`
    + pairs.map(([n, v, options]) =>
        `<div><strong>${ctx.esc(n)}</strong>${ed(ctx, `${prefix} · ${n}`, v, options)}</div>`).join('')
    + `</div>`;
}

function hero(ctx, { iconName, iconClass, title, app }) {
  return `<div class="ws-app-hero">`
    + `<div class="ws-app-icon${iconClass ? ' ' + iconClass : ''}">${ctx.icon(iconName, 28)}</div>`
    + `<div><h1>${ctx.esc(title)}</h1>`
    + `<p class="status-on">상태 ${ed(ctx, `${app} · 서비스 상태`, '모든 사용자에게 사용', SERVICE_STATUS_OPTIONS)}</p></div>`
    + `</div>`;
}

// 현재 선택된 조직 단위 (ctx.ouPicker 구현체가 쓰는 키가 다를 수 있어 순차 조회)
function currentOu(ctx) {
  return ctx.local('selectedOu') || ctx.local('ou') || ctx.local('selectedOrg') || '연습학교';
}

function ouPicker(ctx, selected) {
  if (typeof ctx.ouPicker === 'function') return ctx.ouPicker(selected);
  return `<aside class="org-tree compact">`
    + `<div class="ou-picker-tabs"><button class="active">조직 단위</button></div>`
    + `<label class="ou-search tight">${ctx.icon('search', 16)}<input placeholder="조직 단위 검색"/></label>`
    + `<button class="tree-root ${selected === '연습학교' ? 'selected' : ''}" data-set="selectedOu::연습학교">${ctx.icon('expand_more', 16)} 연습학교</button>`
    + OU_CHILDREN.map(n => `<button class="tree-child ${selected === n ? 'selected' : ''}" data-set="selectedOu::${ctx.esc(n)}">${ctx.esc(n)}</button>`).join('')
    + `</aside>`;
}

function workspacePage(ctx, { crumbText, heroOpts, cards }) {
  return `<div class="section-page wide admin-page apps-section-page workspace-app-page">`
    + crumb(ctx, crumbText)
    + hero(ctx, heroOpts)
    + cards
    + `</div>`;
}

/* ── 개요 (원본 AppsOverviewView) ────────────────────────────── */

function overview(ctx) {
  const wsLinks = ['Gmail', 'Google Meet', 'Classroom', 'Drive 및 Docs', 'Workspace Studio'];
  return `<div class="section-page wide admin-page apps-section-page">`
    + crumb(ctx, '앱 > 개요')
    + `<div class="page-title-row"><div><h1>앱</h1><p>연습학교(school.sen.ms.kr)의 Google Workspace 및 웹 앱을 관리합니다.</p></div></div>`
    + `<div class="apps-overview-grid">`
      + `<article class="dashboard-card" data-nav="apps::Google Workspace">`
        + `<header><div><h2>Google Workspace</h2><p>${WORKSPACE_NESTED.length}개 서비스</p></div>`
        + `<button data-nav="apps::Calendar">Calendar</button></header>`
        + `<div class="card-kv"><strong>Google Workspace 서비스 상태</strong>`
        + ed(ctx, '개요 · Google Workspace 상태', '모든 사용자에게 사용', SERVICE_STATUS_OPTIONS) + `</div>`
        + `<div class="card-links">`
        + wsLinks.map(n => `<button data-nav="apps::${ctx.esc(n)}">${ctx.esc(n)}${ctx.icon('chevron_right', 15)}</button>`).join('')
        + `</div>`
      + `</article>`
      + `<article class="dashboard-card" data-nav="apps::추가 Google 서비스">`
        + `<header><div><h2>추가 Google 서비스</h2><p>AI Studio, Colab 등</p></div></header>`
        + `<div class="card-kv"><strong>기본 상태</strong>`
        + ed(ctx, '개요 · 추가 Google 서비스 기본 상태', '사용', ['사용', '사용 안함', '개별 서비스별로 설정']) + `</div>`
        + `<div class="card-links"><button data-nav="apps::추가 Google 서비스">서비스 관리${ctx.icon('chevron_right', 15)}</button></div>`
      + `</article>`
      + `<article class="dashboard-card" data-nav="apps::Google Workspace Marketplace 앱">`
        + `<header><div><h2>Marketplace 앱</h2><p>${MARKETPLACE_APPS.length}개 앱</p></div></header>`
        + `<div class="card-kv"><strong>사용자 설치</strong>`
        + ed(ctx, '개요 · Marketplace 사용자 설치', '허용된 앱만 설치 허용', ['허용된 앱만 설치 허용', '모든 앱 설치 허용', '설치 허용 안함']) + `</div>`
        + `<div class="card-links"><button data-nav="apps::Google Workspace Marketplace 앱">앱 목록${ctx.icon('chevron_right', 15)}</button></div>`
      + `</article>`
      + `<article class="dashboard-card" data-nav="apps::웹 및 모바일 앱">`
        + `<header><div><h2>웹 및 모바일 앱</h2><p>SAML · OIDC</p></div></header>`
        + `<div class="card-kv"><strong>자동 로그인</strong>`
        + ed(ctx, '개요 · 웹 및 모바일 앱 자동 로그인', '사용', ['사용', '사용 안함', '앱별로 설정']) + `</div>`
        + `<div class="card-links"><button data-toast="앱 추가">앱 추가${ctx.icon('chevron_right', 15)}</button></div>`
      + `</article>`
    + `</div>`
    + `</div>`;
}

/* ── 전용 화면이 없는 Workspace 앱 (원본 WorkspaceEmptySettingsView) ── */

function emptyApp(ctx, appName) {
  const title = `${appName} 설정`;
  return `<div class="section-page wide admin-page apps-section-page workspace-app-page">`
    + crumb(ctx, `앱 > Google Workspace > ${title}`)
    + `<div class="ws-app-hero"><div class="ws-app-icon">${ctx.icon('web_asset', 28)}</div>`
      + `<div><h1>${ctx.esc(title)}</h1>`
      + `<p class="status-on">상태 ${ed(ctx, `${appName} · 서비스 상태`, '모든 사용자에게 사용', SERVICE_STATUS_OPTIONS)}</p></div></div>`
    + `<div class="info-banner soft">${ctx.icon('info', 18)}`
      + `<div><strong>추가 설정은 각 서비스 관리 콘솔에서 관리할 수 있습니다.</strong>`
      + `<span>Gemini 등 일부 기능은 서비스별 Admin Console에서 구성합니다.</span></div>`
      + `<button class="link-btn" data-toast="서비스 상태 알아보기">서비스 상태 알아보기</button></div>`
    + `<article class="settings-card"><header><h2>서비스 상태</h2>${ctx.icon('expand_more', 18)}</header>`
      + statusKv(ctx, appName) + appliedOu(ctx) + `</article>`
    + `<div class="ws-empty-state">${ctx.icon('build', 40)}<strong>표시할 추가 설정 없음</strong><p>이 서비스에는 다른 설정이 없습니다.</p></div>`
    + `</div>`;
}

/* ── Calendar (원본 CalendarSettingsView) ────────────────────── */

function calendar(ctx) {
  const P = 'Calendar';
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Calendar 설정',
    heroOpts: { iconName: 'calendar_month', iconClass: 'cal', title: 'Calendar 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: '공유 설정', desc: '사용자가 캘린더를 공유하는 방법을 관리합니다.',
        body: grid(ctx, [
          ['외부 공유 옵션', '무료/예약됨 정보만 공유 가능', ['정보 공유 안함', '무료/예약됨 정보만 공유 가능', '모든 정보 공유 가능', '모든 정보 공유 및 관리 가능']],
          ['내부 공유 옵션', '모든 정보 공유 가능', ['정보 공유 안함', '무료/예약됨 정보만 공유 가능', '모든 정보 공유 가능', '모든 정보 공유 및 관리 가능']],
          ['기본 외부 공유', '공유하지 않음', ['공유하지 않음', '무료/예약됨 정보만', '모든 정보']],
          ['외부 초대 경고', '사용', ['사용', '사용 안함']],
        ], `${P} · 공유 설정`),
      })
      + accordion(ctx, {
        title: '일반 설정', desc: '캘린더 기본 동작',
        body: grid(ctx, [
          ['캘린더 생성', '허용', ['허용', '허용 안함', '관리자만 허용']],
          ['예약 일정', '사용', ['사용', '사용 안함']],
          ['근무 시간', '사용자가 설정하도록 허용', ['사용자가 설정하도록 허용', '관리자가 지정', '사용 안함']],
          ['자동 수락', '사용 안함', ['사용 안함', '사용', '충돌이 없을 때만 수락']],
        ], `${P} · 일반 설정`),
      })
      + accordion(ctx, {
        title: '리소스 관리', desc: '회의실 및 리소스 예약',
        body: grid(ctx, [
          ['리소스 예약', '허용', ['허용', '허용 안함', '교원만 허용']],
          ['리소스 자동 수락', '사용', ['사용', '사용 안함', '충돌이 없을 때만 수락']],
          ['건물 계층', '연습학교 본관', ['연습학교 본관', '연습학교 별관', '연습학교 체육관', '설정 안함']],
        ], `${P} · 리소스 관리`),
      })
      + accordion(ctx, {
        title: '고급 설정',
        body: grid(ctx, [
          ['Calendar Interop', '사용 안함', ['사용 안함', '사용', 'Exchange 전용']],
          ['스마트 기능', '사용', ['사용', '사용 안함', '사용자가 결정하도록 허용']],
        ], `${P} · 고급 설정`),
      }),
  });
}

/* ── Workspace Studio (원본 WorkspaceStudioSettingsView) ─────── */

function workspaceStudio(ctx) {
  const P = 'Workspace Studio';
  const steps = [['트리거', '사용'], ['조건', '사용'], ['작업', '사용'], ['변수', '사용'], ['커넥터', '사용']];
  const features = [
    ['단계 및 기능', '사용', ['사용', '사용 안함']],
    ['공유', '조직 내 공유 허용', ['조직 내 공유 허용', '외부 공유 허용', '공유 안함']],
    ['웹훅', '사용', ['사용', '사용 안함', '승인된 도메인만 허용']],
    ['실행 기록', '보관 30일', ['보관 7일', '보관 30일', '보관 90일', '보관 안함']],
    ['관리자 승인', '필요 없음', ['필요 없음', '모든 플로우에 필요', '외부 커넥터에만 필요']],
  ];
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Workspace Studio 설정',
    heroOpts: { iconName: 'auto_awesome', iconClass: 'studio', title: 'Workspace Studio 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: '단계 및 기능', desc: '플로우 구성 요소 액세스', open: true,
        body: `<div class="feature-grid">`
          + steps.map(([n, v]) =>
              `<div><span>${ctx.esc(n)}</span>`
              + ed(ctx, `${P} · 단계 및 기능 · ${n}`, v, ['사용', '사용 안함', '교원만 사용'])
              + `</div>`).join('')
          + `</div>`,
      })
      + accordion(ctx, { title: '공유 및 웹훅', body: grid(ctx, features, `${P} · 공유 및 웹훅`) }),
  });
}

/* ── Gmail (원본 GmailSettingsView) ──────────────────────────── */

function gmail(ctx) {
  const P = 'Gmail';
  const sections = [
    ['서비스 상태', '모든 사용자에게 사용'],
    ['사용자 설정', '테마, 서명, 스마트 작성, 기밀 모드'],
    ['호스트', 'school.sen.ms.kr 메일 라우팅 호스트'],
    ['기본 라우팅', '수신/발신 규칙'],
    ['이메일 인증(DKIM)', 'DKIM 키 관리'],
    ['스팸 격리 저장소 관리', '관리자 격리함'],
    ['보안', '첨부파일, 피싱, 스푸핑 보호'],
  ];
  const bodyFor = (title) => {
    if (title === '서비스 상태') return statusKv(ctx, P);
    if (title === '사용자 설정') return grid(ctx, [
      ['스마트 작성', '사용', ['사용', '사용 안함', '사용자가 결정하도록 허용']],
      ['기밀 모드', '사용', ['사용', '사용 안함', '수신만 허용']],
      ['자동 읽음 확인', '사용 안함', ['사용 안함', '사용', '조직 내에서만 사용']],
      ['외부 수신 경고', '사용', ['사용', '사용 안함']],
    ], `${P} · 사용자 설정`);
    if (title === '호스트') return kv(ctx, '호스트 이름', 'mail.school.sen.ms.kr',
      `${P} · 호스트 이름`, ['mail.school.sen.ms.kr', 'smtp.school.sen.ms.kr', 'relay.school.sen.ms.kr', '설정 안함']);
    if (title === '기본 라우팅') return kv(ctx, '규칙', '기본 경로 · 연습학교',
      `${P} · 기본 라우팅 규칙`, ['기본 경로 · 연습학교', '수신 전용 경로', '발신 전용 경로', '규칙 없음']);
    if (title === '이메일 인증(DKIM)') return kv(ctx, 'DKIM', '인증됨 · school.sen.ms.kr',
      `${P} · DKIM`, ['인증됨 · school.sen.ms.kr', '인증 대기 중', '사용 안함']);
    if (title === '스팸 격리 저장소 관리') return kv(ctx, '격리함', '관리자 검토 · 14일 보관',
      `${P} · 스팸 격리 저장소`, ['관리자 검토 · 14일 보관', '관리자 검토 · 30일 보관', '사용자 검토 허용', '사용 안함']);
    if (title === '보안') return grid(ctx, [
      ['첨부파일 보안', '강화됨', ['강화됨', '기본', '사용 안함']],
      ['스푸핑 보호', '사용', ['사용', '사용 안함', '경고만 표시']],
      ['향상된 피싱 및 멀웨어 보호', '사용', ['사용', '사용 안함']],
    ], `${P} · 보안`);
    return '';
  };
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Gmail 설정',
    heroOpts: { iconName: 'mail', iconClass: 'gmail', title: 'Gmail 설정', app: P },
    cards: sections.map(([title, desc], i) =>
      accordion(ctx, { title, desc, open: i === 0, body: bodyFor(title) })).join(''),
  });
}

/* ── Google Meet (원본 MeetSettingsView) ─────────────────────── */

function meet(ctx) {
  const P = 'Google Meet';
  const rows = [
    ['반응', '사용', false, ['사용', '사용 안함']],
    ['녹화', '사용 [P]', true, ['사용 [P]', '사용 안함 [P]', '교원만 사용 [P]']],
    ['스트림', '조직 내 사용 / YouTube 사용 안함 [P]', true, ['조직 내 사용 / YouTube 사용 안함 [P]', '조직 내 사용 / YouTube 사용 [P]', '사용 안함 [P]']],
    ['시각 효과', '배경 사용 / 특수 효과 사용 안함', false, ['배경 사용 / 특수 효과 사용 안함', '배경 사용 / 특수 효과 사용', '모두 사용 안함']],
    ['자동 스크립트', '사용 안함', false, ['사용 안함', '사용', '주최자가 결정하도록 허용']],
    ['추가 부가기능', '사용 안함', false, ['사용 안함', '사용', '승인된 부가기능만 사용']],
    ['오디오', '전화 참가 사용 / 유료 통화 사용 안함', false, ['전화 참가 사용 / 유료 통화 사용 안함', '전화 참가 사용 / 유료 통화 사용', '전화 참가 사용 안함']],
    ['기본 동영상 녹화 화질', '최고 [P]', true, ['최고 [P]', '높음 [P]', '보통 [P]', '자동 [P]']],
    ['기본 동영상 화질', '자동', false, ['자동', '고화질', '표준', '저화질']],
    ['통합', '사용', false, ['사용', '사용 안함']],
    ['통화 생성', '사용', false, ['사용', '사용 안함', '교원만 사용']],
    ['타일 페어링', '사용', false, ['사용', '사용 안함']],
    ['클라이언트 로그 업로드', '사용', false, ['사용', '사용 안함']],
    ['자동 녹화', '사용 안함 [P]', true, ['사용 안함 [P]', '사용 [P]', '주최자가 결정하도록 허용 [P]']],
    ['게이트웨이 상호 운용성', '사용 안함', false, ['사용 안함', '사용']],
    ['회의 스크립트', '사용 [P]', true, ['사용 [P]', '사용 안함 [P]', '주최자가 결정하도록 허용 [P]']],
    ['참석 보고', '사용 [P]', true, ['사용 [P]', '사용 안함 [P]', '참가자 5명 이상일 때만 [P]']],
  ];
  const featureRows = rows.map(([n, v, p, options]) => {
    const name = `${P} · ${n}`;
    const cur = current(ctx, name, v);
    const cls = cur.includes('사용 안함') && !cur.includes('조직') ? 'status-off' : 'status-on';
    const label = cur.includes('사용 안함') && !cur.includes('/') ? 'OFF' : 'ON';
    return `<div class="meet-feature"><div><strong>${ctx.esc(n)}${p ? '<em class="badge-p">P</em>' : ''}</strong>`
      + ed(ctx, name, v, options, cls) + `</div><b class="${cls}">${label}</b></div>`;
  }).join('');
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Google Meet 설정',
    heroOpts: { iconName: 'videocam', iconClass: 'meet', title: 'Google Meet 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: 'Meet 동영상 설정', desc: '회의 기능 및 품질 옵션', open: true,
        body: `<div class="meet-feature-grid">${featureRows}</div>`,
      }),
  });
}

/* ── Google Workspace LTI™ (원본 LtiSettingsView) ────────────── */

function lti(ctx) {
  const P = 'Google Workspace LTI™';
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Google Workspace LTI™ 설정',
    heroOpts: { iconName: 'web_asset', title: 'Google Workspace LTI™ 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: '수업 설정', desc: 'LTI memberships', open: true,
        body: grid(ctx, [
          ['멤버십 동기화', '사용', ['사용', '사용 안함', '수동 동기화']],
          ['역할 매핑', '교사 · 학생', ['교사 · 학생', '교사만 매핑', '매핑 안함']],
          ['수업 생성', '교원 OU 허용', ['교원 OU 허용', '모든 사용자 허용', '허용 안함']],
        ], `${P} · 수업 설정`),
      })
      + accordion(ctx, {
        title: '원본성 보고서',
        body: `<div class="card-kv"><strong>교내 일치</strong>`
          + ed(ctx, `${P} · 원본성 보고서 · 교내 일치`, '사용 중지', ['사용 중지', '사용', '교원만 사용'])
          + `</div>`,
      }),
  });
}

/* ── Classroom (원본 ClassroomSettingsView) ──────────────────── */

function classroom(ctx) {
  const P = 'Classroom';
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Classroom 설정',
    heroOpts: { iconName: 'web_asset', title: 'Classroom 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: '일반 설정',
        body: grid(ctx, [
          ['수업 만들기', '교원만 허용', ['교원만 허용', '모든 사용자 허용', '확인된 교사만 허용', '허용 안함']],
          ['수업 등록', '도메인 사용자', ['도메인 사용자', '도메인 및 허용된 외부 도메인', '초대받은 사용자만']],
          ['가디언 요약', '사용', ['사용', '사용 안함']],
        ], `${P} · 일반 설정`),
      })
      + accordion(ctx, {
        title: '수업 참여 설정',
        body: grid(ctx, [
          ['외부 교사 초대', '허용 안함', ['허용 안함', '허용', '허용 목록 도메인만 허용']],
          ['수업 코드', '사용', ['사용', '사용 안함', '교원이 결정하도록 허용']],
        ], `${P} · 수업 참여 설정`),
      })
      + accordion(ctx, {
        title: '원본성 보고서',
        body: kv(ctx, '교내 일치', '사용 안함', `${P} · 원본성 보고서 · 교내 일치`, ['사용 안함', '사용', '교원만 사용']),
      }),
  });
}

/* ── Drive 및 Docs (원본 DriveDocsSettingsView) ──────────────── */

function driveDocs(ctx) {
  const P = 'Drive 및 Docs';
  return workspacePage(ctx, {
    crumbText: '앱 > Google Workspace > Drive 및 Docs 설정',
    heroOpts: { iconName: 'cloud', title: 'Drive 및 Docs 설정', app: P },
    cards:
      accordion(ctx, { title: '서비스 상태', open: true, body: statusKv(ctx, P) })
      + accordion(ctx, {
        title: '공유 설정',
        body: grid(ctx, [
          ['외부 공유', '허용(경고 표시)', ['허용(경고 표시)', '허용(경고 없음)', '허용 목록 도메인만 허용', '사용 안함']],
          ['링크 공유 기본값', '제한됨 · 연습학교', ['제한됨 · 연습학교', '연습학교 사용자(링크 보유)', '링크가 있는 모든 사용자']],
          ['방문 사용자 액세스', '사용 안함', ['사용 안함', '사용']],
        ], `${P} · 공유 설정`),
      })
      + accordion(ctx, {
        title: '기능 및 애플리케이션',
        body: grid(ctx, [
          ['오프라인', '사용', ['사용', '사용 안함']],
          ['Drive for desktop', '사용', ['사용', '사용 안함', '승인된 기기만 허용']],
          ['스마트 칩', '사용', ['사용', '사용 안함']],
        ], `${P} · 기능 및 애플리케이션`),
      })
      + accordion(ctx, {
        title: '데이터 액세스',
        body: kv(ctx, 'Drive SDK', '신뢰할 수 있는 앱만', `${P} · Drive SDK`, ['신뢰할 수 있는 앱만', '모든 앱 허용', '사용 안함']),
      }),
  });
}

/* ── 서비스 상태 (원본 WorkspaceServiceStatusView) ───────────── */

function serviceStatus(ctx) {
  const rows = WORKSPACE_NESTED.filter(n => n !== '서비스 상태' && n !== '검토');
  return `<div class="section-page wide admin-page apps-section-page">`
    + crumb(ctx, '앱 > Google Workspace > 서비스 상태')
    + `<h1>서비스 상태</h1>`
    + `<p class="page-desc">연습학교 Google Workspace 서비스 상태를 확인합니다.</p>`
    + `<div class="data-panel flat"><table class="admin-table">`
      + `<thead><tr><th>서비스</th><th>상태</th><th>적용</th></tr></thead>`
      + `<tbody>`
      + rows.map(n =>
          `<tr><td><b class="blue-text">${ctx.esc(n)}</b></td>`
          + `<td>${ed(ctx, `${n} · 서비스 상태`, '모든 사용자에게 사용', SERVICE_STATUS_OPTIONS)}</td>`
          + `<td>${ed(ctx, `서비스 상태 적용 · ${n}`, '연습학교', OU_OPTIONS, '')}</td></tr>`).join('')
      + `</tbody></table></div>`
    + `</div>`;
}

/* ── 검토 (원본 WorkspaceReviewView) ─────────────────────────── */

function review(ctx) {
  const rows = [['AI Studio', '추가 Google 서비스'], ['Colab', '추가 Google 서비스']];
  return `<div class="section-page wide admin-page apps-section-page">`
    + crumb(ctx, '앱 > Google Workspace > 검토')
    + `<h1>검토</h1>`
    + `<p class="page-desc">추가 검토가 필요한 Workspace 설정을 확인합니다.</p>`
    + `<div class="info-banner soft">${ctx.icon('warning', 18)}`
      + `<div><strong>확인 필요 항목 2개</strong><span>추가 Google 서비스와 Marketplace 배포 상태를 검토하세요.</span></div>`
      + `<button class="link-btn" data-toast="검토 시작">검토</button></div>`
    + `<div class="data-panel flat"><table class="admin-table">`
      + `<thead><tr><th>항목</th><th>유형</th><th>상태</th></tr></thead>`
      + `<tbody>`
      + rows.map(([n, t]) =>
          `<tr><td><b>${ctx.esc(n)}</b></td><td>${ctx.esc(t)}</td>`
          + `<td>${ed(ctx, `검토 · ${n}`, '확인 필요', REVIEW_OPTIONS, '')}</td></tr>`).join('')
      + `</tbody></table></div>`
    + `</div>`;
}

/* ── 추가 Google 서비스 (원본 AdditionalGoogleServicesView) ──── */

function additionalServices(ctx) {
  const selectedOu = typeof ctx.currentOu === 'function' ? ctx.currentOu() : currentOu(ctx);
  return `<div class="section-page wide admin-page apps-section-page">`
    + crumb(ctx, '앱 > 추가 Google 서비스')
    + `<div class="page-title-row"><div><h1>추가 Google 서비스</h1><p>연습학교 OU별로 추가 Google 서비스 사용 여부를 관리합니다.</p></div>`
      + `<button class="primary-button" data-toast="서비스 추가">서비스 추가</button></div>`
    + `<div class="apps-layout">`
      + ouPicker(ctx, selectedOu)
      + `<section class="data-panel apps-panel">`
        + `<div class="action-strip"><strong>서비스 | ${EXTRA_GOOGLE_SERVICES.length}개 · ${ctx.esc(selectedOu)}</strong>`
        + `<button data-toast="서비스 추가">서비스 추가</button></div>`
        + `<div class="table-wrap"><table class="admin-table">`
          + `<thead><tr><th>서비스</th><th>상태</th><th>검토</th><th></th></tr></thead>`
          + `<tbody>`
          + EXTRA_GOOGLE_SERVICES.map(s =>
              `<tr><td><b class="blue-text">${ctx.esc(s.name)}</b></td>`
              + `<td>${ed(ctx, `추가 Google 서비스 · ${s.name}`, s.status, ['사용', '사용 안함', '일부 조직 단위에만 사용'])}</td>`
              + `<td>${ed(ctx, `추가 Google 서비스 검토 · ${s.name}`, s.needConfirm ? '확인 필요' : '—', REVIEW_OPTIONS.concat(['—']), '')}</td>`
              + `<td><button class="link-btn" data-toast="${ctx.esc(s.name)}">세부정보</button></td></tr>`).join('')
          + `</tbody></table></div>`
      + `</section>`
    + `</div>`
    + `</div>`;
}

/* ── Google Workspace Marketplace 앱 (원본 MarketplaceAppsView) ─ */

function marketplaceApps(ctx) {
  return ctx.listPage({
    key: 'marketplace-apps',
    title: 'Google Workspace Marketplace 앱',
    breadcrumb: '앱',
    description: 'Marketplace 앱 배포와 허용 목록을 관리합니다.',
    addLabel: '앱 설치',
    ouPicker: true,
    emptyTitle: '아직 설치한 Marketplace 앱이 없습니다',
    columns: [
      { key: 'name', label: '앱 이름' },
      { key: 'publisher', label: '게시자' },
      { key: 'status', label: '배포', editable: true, options: MARKETPLACE_STATUS_OPTIONS },
      { key: 'users', label: '사용자' },
    ],
    fields: [
      { name: 'name', label: '앱 이름', required: true, placeholder: '예: Kahoot!' },
      { name: 'publisher', label: '게시자', placeholder: '예: Kahoot!' },
      { name: 'status', label: '배포', type: 'select', options: MARKETPLACE_STATUS_OPTIONS },
      { name: 'users', label: '사용자', type: 'select', options: MARKETPLACE_USER_OPTIONS },
    ],
  });
}

/* ── 웹 및 모바일 앱 (원본 WebMobileAppsView) ───────────────── */

function webMobileApps(ctx) {
  return ctx.listPage({
    key: 'web-mobile-apps',
    title: '웹 및 모바일 앱',
    breadcrumb: '앱',
    description: 'SAML/OIDC 웹 앱을 관리합니다.',
    addLabel: '앱 추가',
    emptyTitle: '아직 추가한 웹·모바일 앱이 없습니다',
    columns: [
      { key: 'name', label: '이름' },
      { key: 'type', label: '유형', editable: true, options: ['웹 앱', 'Android 앱', 'iOS 앱'] },
      { key: 'status', label: '상태', editable: true, options: ['사용', '사용 안함', '일부 조직 단위에만 사용'] },
      { key: 'users', label: '사용자' },
    ],
    fields: [
      { name: 'name', label: '앱 이름', required: true, placeholder: '예: 연습학교 LMS' },
      { name: 'type', label: '유형', type: 'select', options: ['웹 앱', 'Android 앱', 'iOS 앱'] },
      { name: 'status', label: '상태', type: 'select', options: ['사용', '사용 안함', '일부 조직 단위에만 사용'] },
      { name: 'users', label: '사용자', type: 'select', options: ['전체', '교원', '학생', '교원·학생'] },
    ],
  });
}

/* ── LDAP (원본 LdapView) ────────────────────────────────────── */

function ldap(ctx) {
  return `<div class="section-page wide admin-page apps-section-page">`
    + crumb(ctx, '앱 > LDAP')
    + `<div class="page-title-row"><div><h1>LDAP</h1><p>Secure LDAP 클라이언트를 관리합니다.</p></div>`
      + `<button class="primary-button" data-toast="LDAP 클라이언트 추가">클라이언트 추가</button></div>`
    + `<div class="data-panel flat"><table class="admin-table">`
      + `<thead><tr><th>클라이언트</th><th>상태</th><th>인증서</th><th>적용</th></tr></thead>`
      + `<tbody><tr><td><b class="blue-text">연습학교 LDAP</b></td>`
        + `<td>${ed(ctx, 'LDAP · 연습학교 LDAP · 상태', '사용', ['사용', '사용 안함', '일시 중지'])}</td>`
        + `<td>${ed(ctx, 'LDAP · 연습학교 LDAP · 인증서', '유효', ['유효', '만료 예정', '만료됨', '업로드 필요'], '')}</td>`
        + `<td>${ed(ctx, 'LDAP · 연습학교 LDAP · 적용', '연습학교', OU_OPTIONS, '')}</td></tr></tbody>`
      + `</table></div>`
    + `</div>`;
}

/* ── 뷰 레지스트리 (원본 AppsSectionView 라우팅) ─────────────── */

const views = {
  '개요': { render: overview },
  'Google Workspace': { render: overview },
  '추가 Google 서비스': { render: additionalServices },
  '웹 및 모바일 앱': { render: webMobileApps },
  'Google Workspace Marketplace 앱': { render: marketplaceApps },
  'LDAP': { render: ldap },
  '서비스 상태': { render: serviceStatus },
  '검토': { render: review },
  'Calendar': { render: calendar },
  'Workspace Studio': { render: workspaceStudio },
  'Gmail': { render: gmail },
  'Google Meet': { render: meet },
  'Google Workspace LTI™': { render: lti },
  'Classroom': { render: classroom },
  'Drive 및 Docs': { render: driveDocs },
};

// 전용 화면이 없는 나머지 Workspace 앱은 원본과 동일하게 빈 설정 화면으로.
// (AppSheet, Chrome 동기화, Google Vault, Google Voice, Google Chat,
//  Groups for Business, Keep, Read Along, Sites, Tasks)
for (const name of WORKSPACE_NESTED) {
  if (!views[name]) views[name] = { render: (ctx) => emptyApp(ctx, name) };
}

export default views;

/*
 ─────────────────────────────────────────────────────────────────
 pages.css 에 추가로 필요한 CSS (AccordionCard를 <details>/<summary>로
 바꾸면서 생긴 것. 나머지 클래스는 globals.css → pages.css 에 이미 존재)

 .accordion-card{padding:0}
 .accordion-card>summary{
   display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
   padding:20px 22px;cursor:pointer;list-style:none;margin:0;
 }
 .accordion-card>summary::-webkit-details-marker{display:none}
 .accordion-card>summary::marker{content:''}
 .accordion-card>summary h2{margin:0;font-size:18px;font-weight:500}
 .accordion-card>summary p{margin:4px 0 0;color:#5f6368;font-size:13px}
 .accordion-card>summary .material-symbols-outlined{transition:transform .15s}
 .accordion-card[open]>summary .material-symbols-outlined{transform:rotate(180deg)}
 .accordion-card .accordion-body{padding:0 22px 20px}
 .accordion-card .accordion-body .settings-card-grid,
 .accordion-card .accordion-body .card-kv{margin-top:0}

 ※ 기존 `.accordion-card header{cursor:pointer}` 규칙은 더 이상 쓰이지 않음
   (header → summary 로 교체됨). 남겨두어도 무해함.
 ─────────────────────────────────────────────────────────────────
*/
