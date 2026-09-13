// 담당 범위: 'Chrome 브라우저' 섹션 전체 (개요 / 설정 가이드 / 관리 브라우저 / 관리 프로필 / 설정 / 커스텀 구성 / 토큰 / 앱 및 확장 프로그램 / 커넥터 / 보고서)

import { chromePoliciesByTab } from '../data/chrome-user-policies.js';
import { chromeAppsExtensionSettingsCategories } from '../data/chrome-apps-extension-settings.js';
import { chromeDevicePolicyCategories } from '../data/chrome-device-policies.js';
import { chromeGuestSessionCategories } from '../data/chrome-guest-session-policies.js';

/** 탭별 정책 카탈로그 — 기기 설정/관리 게스트 세션 설정은 실제 콘솔에서 옮겨온 카탈로그 사용 */
const CATALOG_BY_TAB = {
  '사용자 및 브라우저 설정': chromePoliciesByTab['사용자 및 브라우저 설정'],
  '기기 설정': chromeDevicePolicyCategories,
  '관리 게스트 세션 설정': chromeGuestSessionCategories,
};

/** 앱 및 확장 프로그램 목록의 초기 데이터 (app.js 가 state.apps 로 복사해 관리) */
export const SAMPLE_APPS = [
  { name: 'Padlet', id: 'com.wallwisher.Padlet', policy: '설치 허용', pinned: 'warn' },
  { name: 'kr.smobile.app.t3', id: 'kr.smobile.app.t3', policy: '설치 허용', pinned: '' },
  { name: 'Kami for Google Chrome™', id: 'kami', policy: '강제 설치', pinned: '고정되지 않음' },
  { name: 'Canva', id: 'canva', policy: '설치 허용', pinned: 'warn' },
  { name: 'Sketchbook', id: 'sketchbook', policy: '설치 허용', pinned: 'warn' },
  { name: 'Zoom Workplace for Chromebook', id: 'zoom', policy: '설치 허용', pinned: '' },
  { name: '이비스 페인트 X (ibis Paint X)', id: 'ibis', policy: '설치 허용', pinned: 'warn' },
  { name: 'Chrome Remote Desktop', id: 'crd', policy: '강제 설치', pinned: '고정되지 않음' },
  { name: 'Google 렌즈 (Google Lens)', id: 'lens', policy: '설치 허용', pinned: 'warn' },
  { name: '핑커벨(학생용)', id: 'pinkerbell', policy: '설치 허용', pinned: '' },
];

const SETTINGS_TABS = ['사용자 및 브라우저 설정', '기기 설정', '관리 게스트 세션 설정'];
const SETTINGS_SCOPES = {
  '사용자 및 브라우저 설정': 'chrome-user',
  '기기 설정': 'chrome-device',
  '관리 게스트 세션 설정': 'chrome-guest',
};

const APPS_TABS = ['개요', '사용자 및 브라우저', '설정', '요청'];
const SETUP_STEPS = ['조직 설정하기', '기기 제품군 등록하기', '사용자 및 기기 정책 설정하기', '앱 및 확장 프로그램 구성', '보고서 분석하기'];
const AI_FILTERS = ['정책', '확장 프로그램', '최종 사용자 생산성', '관리', '보안'];

function countPolicies(categories) {
  return (categories || []).reduce((n, c) => n + c.items.length, 0);
}

/* ------------------------------------------------------------------ 개요 */

function renderOverview(ctx) {
  const filters = AI_FILTERS
    .map((t, i) => `<button class="${i === 0 ? 'active' : ''}" data-toast="${ctx.esc(t)}">${i === 0 ? '✓ ' : ''}${ctx.esc(t)}</button>`)
    .join('');

  const recos = [
    ['최근에 추가된 설정 구성하기', '사용자 및 브라우저에 대한 새로운 설정을 검토합니다.', '<button class="link-btn" data-nav="chrome::설정">구성</button>'],
    ['클라우드 보고서 사용 설정하기', '기기에 대한 보고를 사용 설정하고 24시간 내에 결과를 확인합니다.', '<button class="link-btn" data-toast="사용 설정">사용 설정</button>'],
    ['민감한 파일 전송 모니터링', '내부자 위험 및 잠재적인 데이터 손실로부터 보호', '<button class="link-btn" data-toast="사용 설정">사용 설정</button>'],
    ['iOS에서 사용자 관리 사용 설정', 'iPhone, iPad 등 더 많은 기기에서 업무 데이터를 보호하세요', '<button class="link-btn" data-toast="사용 설정">사용 설정</button>'],
  ].map(([title, desc, btn]) => `<li><div><strong>${ctx.esc(title)}</strong><small>${ctx.esc(desc)}</small></div>${btn}</li>`).join('');

  const widget = (title) => `<article><h3>${ctx.esc(title)}</h3><div class="stat-row"><span>활성<br><b>0</b></span><span>활동 안함<br><b>0</b></span><span>새로운 기능<br><b>0</b></span></div></article>`;

  return `<div class="section-page wide admin-page chrome-overview">
    ${ctx.crumb('Chrome 브라우저 > 개요')}
    <article class="reco-card">
      <header><h2>권장사항 ${ctx.icon('info', 16)}</h2><span>작업 5개 중 0개 완료</span></header>
      <div class="ai-note-box">
        <div class="ai-note-head">${ctx.icon('auto_awesome', 16)}<strong>AI가 합성한 Chrome 154 출시 노트 내용 검토</strong><em>Gemini로 생성됨</em></div>
        <div class="ai-filters">${filters}</div>
        <div class="ai-items">
          <div><strong>자동 완성 데이터 관리</strong><p>AutofillSettings policy in Chrome 154</p><button class="link-btn" data-toast="JSON">JSON으로 구성</button></div>
          <div><strong>개발자 도구 제어</strong><p>DeveloperToolsAvailability policy for Android in Chrome 154</p><button class="link-btn" data-nav="chrome::설정">설정 업데이트</button></div>
        </div>
      </div>
      <ul class="reco-list">${recos}</ul>
    </article>
    <div class="chrome-widgets">${widget('관리 브라우저')}${widget('관리 프로필')}</div>
  </div>`;
}

/* ----------------------------------------------------------- 설정 가이드 */

function renderSetupGuide(ctx) {
  const tab = ctx.local('setupTab', 'ChromeOS');
  const steps = SETUP_STEPS
    .map((s) => `<button data-toast="${ctx.esc(s)}">${ctx.esc(s)}${ctx.icon('chevron_right', 18)}</button>`)
    .join('');

  return `<div class="section-page wide admin-page">
    ${ctx.crumb('Chrome 브라우저 > 설정 가이드')}
    <h1>Chrome 관리에 오신 것을 환영합니다</h1>
    <div class="setup-tabs">
      <button class="${tab === 'ChromeOS' ? 'active' : ''}" data-set="setupTab::ChromeOS">${ctx.icon('laptop_chromebook', 16)} ChromeOS</button>
      <button class="${tab === 'Chrome 브라우저' ? 'active' : ''}" data-set="setupTab::Chrome 브라우저">${ctx.icon('language', 16)} Chrome 브라우저</button>
    </div>
    <h3 class="setup-section">기본사항으로 시작하기</h3>
    <article class="tour-card">
      <div>
        <h2>ChromeOS 관리 소개</h2>
        <p>대화형 둘러보기를 사용하여 테스트 기기를 등록하고 몇 가지 정책을 설정하는 등의 작업을 합니다. ChromeOS 관리를 살펴보고 테스트할 수 있는 안전한 공간입니다.</p>
        <button class="link-btn" data-toast="작업 8개">작업 8개 ${ctx.icon('expand_more', 14)}</button>
        <div><button class="primary-button" data-toast="둘러보기">둘러보기 시작</button></div>
      </div>
      <div class="tour-art"></div>
    </article>
    <h3 class="setup-section">전체 설정 및 배포 시작하기</h3>
    <p class="page-desc">준비가 완료되면 다음 단계에 따라 배포하세요.</p>
    <div class="setup-accordion">${steps}</div>
  </div>`;
}

/* ----------------------------------------------- 앱 및 확장 프로그램 */

function renderApps(ctx) {
  const tab = ctx.local('appsTab', '사용자 및 브라우저');
  const selectedOu = '연습학교';
  const tabs = APPS_TABS
    .map((t) => `<button class="${tab === t ? 'active' : ''}" data-set="appsTab::${ctx.esc(t)}">${ctx.esc(t)}</button>`)
    .join('');

  let body;
  if (tab === '설정') {
    body = `<div class="chrome-ext-settings">
      <div class="settings-tools"><span>표시: 지원됨 · ${ctx.esc(selectedOu)}에 적용</span><button data-toast="필터">${ctx.icon('add', 18)} 필터 검색 또는 추가</button></div>
      ${ctx.policyTable({ scope: 'chrome-apps-ext', categories: chromeAppsExtensionSettingsCategories })}
    </div>`;
  } else {
    const appList = ctx.state.apps && ctx.state.apps.length ? ctx.state.apps : SAMPLE_APPS;
    const rows = appList.map((a) => {
      const pinned = a.pinned === 'warn'
        ? `<span class="warn-icon">${ctx.icon('warning', 14)}</span>`
        : ctx.esc(a.pinned || '—');
      const scope = `chrome-apps:${ctx.currentOu()}`;
      return `<tr>
        <td><b>${ctx.esc(a.name)}</b><small class="muted-id">${ctx.esc(a.id)}</small></td>
        <td>${ctx.editable({ scope, name: `${a.name} · 설치 정책`, value: a.policy, section: '앱 및 확장 프로그램',
          options: ['설치 허용', '강제 설치', '설치 및 고정', '차단', '삭제'] })}</td>
        <td>${a.pinned === 'warn' ? pinned : ctx.editable({ scope, name: `${a.name} · 고정 승인 버전`, value: a.pinned || '고정되지 않음', section: '앱 및 확장 프로그램',
          options: ['고정되지 않음', '최신 버전으로 고정', '이전 버전 유지'] })}</td>
        <td class="col-actions">
          <button class="row-action danger" data-action="delete-app" data-id="${ctx.esc(a.id)}" title="목록에서 삭제">${ctx.icon('delete', 18)}</button>
        </td>
      </tr>`;
    }).join('');

    body = `<div class="apps-banner"><strong>Chrome 웹 스토어</strong>${ctx.editable({
        scope: `chrome-apps:${ctx.currentOu()}`, name: 'Chrome 웹 스토어 · 설치 정책', section: '앱 및 확장 프로그램',
        value: '관리자가 차단하지 않은 모든 앱 설치 허용',
        options: ['관리자가 차단하지 않은 모든 앱 설치 허용', '허용 목록의 앱만 설치 허용', '허용 목록의 앱만 설치 허용(사용자가 확장 프로그램 요청 가능)', '모든 앱 차단'],
      })}</div>
      <div class="filter-strip"><button data-toast="필터 검색 또는 추가">${ctx.icon('add', 17)} 필터 검색 또는 추가</button></div>
      <div class="table-wrap"><table class="admin-table">
        <thead><tr><th>이름</th><th>설치 정책</th><th>고정 승인 버전</th><th class="col-actions"></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <div class="table-footer"><span>페이지당 행 수: 10</span><span>${appList.length}개 중 1-${appList.length}</span></div>
      <button class="fab-yellow" data-modal="app-source" aria-label="앱 및 확장 프로그램 추가" title="앱 및 확장 프로그램 추가">${ctx.icon('add', 24)}</button>`;
  }

  return `<div class="section-page wide admin-page apps-ext-page">
    ${ctx.crumb('Chrome 브라우저 > 앱 및 확장 프로그램')}
    <h1>앱 및 확장 프로그램</h1>
    <div class="apps-layout">
      ${ctx.ouPicker(selectedOu)}
      <section class="data-panel apps-panel">
        <div class="apps-tabs">${tabs}</div>
        ${body}
      </section>
    </div>
  </div>`;
}

/* ----------------------------------------------------------------- 설정 */

function renderSettings(ctx) {
  const tab = ctx.local('tab', '사용자 및 브라우저 설정');
  const selectedOu = '연습학교';
  const categories = CATALOG_BY_TAB[tab] || chromePoliciesByTab[tab] || [];
  const scope = SETTINGS_SCOPES[tab] || 'chrome-user';
  const policyCount = countPolicies(categories);
  const tabs = SETTINGS_TABS
    .map((name) => `<button class="${tab === name ? 'active' : ''}" data-set="tab::${ctx.esc(name)}">${ctx.esc(name)}</button>`)
    .join('');

  return `<div class="section-page wide admin-page settings-page">
    ${ctx.crumb('Chrome 브라우저 > 설정')}
    <h1>설정</h1>
    <div class="settings-tabs top">${tabs}</div>
    <div class="chrome-settings-layout">
      ${ctx.ouPicker(selectedOu)}
      <section class="settings-main panel">
        <div class="settings-tools"><span>표시: 지원됨</span><button data-toast="필터">${ctx.icon('add', 18)} 필터 검색 또는 추가</button><button data-toast="최근 변경사항">최근 변경사항</button></div>
        <div class="settings-title"><span class="section-icon">${ctx.icon('language', 22)}</span><div><strong>${ctx.esc(tab)}</strong><small>${policyCount}개 정책 · ${ctx.esc(selectedOu)}에 적용 · 항목을 눌러 변경</small></div></div>
        ${ctx.policyTable({ scope, categories })}
      </section>
    </div>
  </div>`;
}

/* ------------------------------------------ 단순 목록형 하위 메뉴들 */

const OU_FIELD_OPTIONS = ['연습학교', '1.관리자', '2.교원', '3.학생', '4.태블릿기기', '5.크롬북(삭제금지)'];

/** 추가·삭제가 가능한 목록 화면(ctx.listPage) 구성 */
const COLLECTION_PAGES = {
  '관리 브라우저': {
    key: 'managed-browsers',
    title: '관리 브라우저',
    breadcrumb: 'Chrome 브라우저',
    description: '클라우드에 등록된 브라우저를 확인합니다.',
    addLabel: '브라우저 등록',
    emptyTitle: '아직 등록된 관리 브라우저가 없습니다',
    emptyHint: '‘브라우저 등록’을 눌러 브라우저를 직접 등록해 보세요. 연습 내용은 이 브라우저에만 저장됩니다.',
    columns: [
      { key: 'name', label: '기기 이름' },
      { key: 'version', label: '버전' },
      { key: 'lastActivity', label: '마지막 활동' },
      { key: 'status', label: '상태', editable: true, options: ['활성', '비활성'] },
    ],
    fields: [
      { name: 'name', label: '기기 이름', required: true, placeholder: '예: 교무실-PC-01' },
      { name: 'version', label: 'Chrome 버전', placeholder: '예: 154.0.7204.49' },
      { name: 'lastActivity', label: '마지막 활동', placeholder: '예: 2026. 9. 12.' },
      { name: 'status', label: '상태', type: 'select', options: ['활성', '비활성'] },
    ],
  },
  '관리 프로필': {
    key: 'managed-profiles',
    title: '관리 프로필',
    breadcrumb: 'Chrome 브라우저',
    description: '관리되는 사용자 프로필을 확인합니다.',
    addLabel: '프로필 추가',
    emptyTitle: '관리 프로필이 아직 없습니다',
    columns: [
      { key: 'user', label: '사용자' },
      { key: 'browser', label: '브라우저' },
      { key: 'lastSync', label: '마지막 동기화' },
      { key: 'status', label: '상태', editable: true, options: ['활성', '비활성'] },
    ],
    fields: [
      { name: 'user', label: '사용자', required: true, placeholder: '예: teacher01@practice.senedu.kr' },
      { name: 'browser', label: '브라우저', placeholder: '예: Chrome 154 (Windows)' },
      { name: 'status', label: '상태', type: 'select', options: ['활성', '비활성'] },
    ],
  },
  '커스텀 구성': {
    key: 'custom-configs',
    title: '커스텀 구성',
    breadcrumb: 'Chrome 브라우저',
    description: 'JSON 기반 맞춤 정책을 관리합니다.',
    addLabel: '구성 만들기',
    columns: [
      { key: 'name', label: '이름' },
      { key: 'target', label: '적용 대상' },
      { key: 'modified', label: '수정일' },
      { key: 'status', label: '상태', editable: true, options: ['초안', '게시됨'] },
    ],
    fields: [
      { name: 'name', label: '이름', required: true, placeholder: '예: 학교 기본 정책' },
      { name: 'target', label: '적용 대상', type: 'select', options: OU_FIELD_OPTIONS },
      { name: 'modified', label: '수정일', type: 'date' },
      { name: 'json', label: 'JSON 내용', type: 'textarea', placeholder: '{ "HomepageLocation": "https://practice.senedu.kr" }' },
    ],
  },
  '토큰': {
    key: 'enroll-tokens',
    title: '토큰',
    breadcrumb: 'Chrome 브라우저',
    description: '브라우저 등록 토큰을 발급·관리합니다.',
    addLabel: '토큰 만들기',
    columns: [
      { key: 'name', label: '토큰 이름' },
      { key: 'created', label: '생성일' },
      { key: 'expires', label: '만료' },
      { key: 'uses', label: '사용' },
    ],
    fields: [
      { name: 'name', label: '토큰 이름', required: true, placeholder: '예: 연습-등록-토큰' },
      { name: 'created', label: '생성일', type: 'date' },
      { name: 'expires', label: '만료일', type: 'date' },
    ],
  },
  '커넥터': {
    key: 'connectors',
    title: '커넥터',
    breadcrumb: 'Chrome 브라우저',
    description: '보안·보고 커넥터를 연결합니다.',
    addLabel: '커넥터 추가',
    columns: [
      { key: 'name', label: '커넥터' },
      { key: 'status', label: '상태', editable: true, options: ['사용', '사용 안 함'] },
      { key: 'lastSync', label: '마지막 동기화' },
      { key: 'desc', label: '설명' },
    ],
    fields: [
      { name: 'name', label: '커넥터 이름', required: true, placeholder: '예: Chrome Enterprise 커넥터' },
      { name: 'status', label: '상태', type: 'select', options: ['사용', '사용 안 함'] },
      { name: 'desc', label: '설명', placeholder: '예: 데이터 손실 방지' },
    ],
  },
};

const LIST_PAGES = {
  '보고서/개요': {
    title: '보고서 개요',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '등록된 브라우저·기기의 보고 현황을 한눈에 확인합니다.',
    columns: ['보고서', '설명', '상태', '마지막 업데이트'],
    rows: [
      ['기기', '등록된 기기와 브라우저 상태', '준비됨', '오늘'],
      ['버전', '브라우저 버전 분포', '준비됨', '오늘'],
      ['앱 및 확장 프로그램 사용', '설치된 확장 프로그램과 권한', '준비됨', '어제'],
      ['통계', '브라우저 활동 통계', '준비됨', '오늘'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/기기': {
    title: '기기',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '브라우저가 등록된 기기 목록입니다.',
    columns: ['기기', 'OS', '브라우저 버전', '정책 수'],
    rows: [
      ['교무실-PC-01', 'Windows 11', '128.0.6613.120', '14'],
      ['과학실-PC-03', 'Windows 10', '127.0.6533.100', '14'],
      ['도서관-크롬북-12', 'ChromeOS', '128.0.6613.114', '22'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/버전': {
    title: '버전',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '조직 내 브라우저 버전 분포입니다.',
    columns: ['버전', '채널', '기기 수', '비율'],
    rows: [
      ['128.0.6613.120', 'Stable', '48', '62%'],
      ['127.0.6533.100', 'Stable', '21', '27%'],
      ['129.0.6668.29', 'Beta', '8', '11%'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/앱 및 확장 프로그램 사용': {
    title: '앱 및 확장 프로그램 사용',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '설치된 앱·확장 프로그램과 요청 권한을 확인합니다.',
    columns: ['이름', '유형', '설치 수', '권한'],
    rows: [
      ['Kahoot!', '확장 프로그램', '35', '탭 읽기'],
      ['Google Keep', '확장 프로그램', '52', '저장소'],
      ['Padlet', '웹앱', '18', '—'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/Android 앱 설치': {
    title: 'Android 앱 설치',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: 'ChromeOS 기기에 설치된 Android 앱 현황입니다.',
    columns: ['앱', '패키지', '설치 수', '상태'],
    rows: [
      ['Google Classroom', 'com.google.android.apps.classroom', '124', '설치됨'],
      ['ibis Paint X', 'jp.ne.ibis.ibispaintx.app', '31', '설치됨'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/통계': {
    title: '통계',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '브라우저 사용 통계를 기간별로 확인합니다.',
    columns: ['항목', '값', '기간', '추세'],
    rows: [
      ['활성 브라우저', '77', '지난 7일', '▲ 4'],
      ['정책 적용 기기', '69', '지난 7일', '▲ 2'],
      ['미보고 기기', '3', '지난 28일', '▼ 1'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/프린터': {
    title: '프린터',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '조직에 배포된 프린터와 인쇄 작업 현황입니다.',
    columns: ['프린터', '연결 기기', '인쇄 작업', '상태'],
    rows: [
      ['교무실-복합기', '42', '318', '온라인'],
      ['행정실-프린터', '11', '95', '온라인'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/Chrome 로그 이벤트': {
    title: 'Chrome 로그 이벤트',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: '브라우저에서 수집된 보안·정책 이벤트 로그입니다.',
    columns: ['시간', '이벤트', '사용자', '기기'],
    rows: [
      ['오늘 09:12', '정책 업데이트 적용', 'system', '교무실-PC-01'],
      ['오늘 08:47', '확장 프로그램 설치 차단', 'student12@practice.senedu.kr', '도서관-크롬북-12'],
      ['어제 15:30', '안전하지 않은 사이트 경고', 'student07@practice.senedu.kr', '도서관-크롬북-08'],
    ],
    actionLabel: '보고서 새로고침',
  },
  '보고서/ChromeOS 비정상 종료': {
    title: 'ChromeOS 비정상 종료',
    breadcrumb: 'Chrome 브라우저 > 보고서',
    description: 'ChromeOS 기기의 비정상 종료(크래시) 보고입니다.',
    columns: ['날짜', '기기', '버전', '횟수'],
    rows: [
      ['2026-09-10', '도서관-크롬북-05', '128.0.6613.114', '2'],
      ['2026-09-08', '과학실-크롬북-02', '127.0.6533.99', '1'],
    ],
    actionLabel: '보고서 새로고침',
  },
};

function listView(link) {
  const config = LIST_PAGES[link];
  return { render: (ctx) => ctx.adminListPage(config) };
}

function collectionView(link) {
  const config = COLLECTION_PAGES[link];
  return { render: (ctx) => ctx.listPage(config) };
}

// 키 순서 = 사이드바 링크 순서
export default {
  '개요': { render: renderOverview },
  '설정 가이드': { render: renderSetupGuide },
  '관리 브라우저': collectionView('관리 브라우저'),
  '관리 프로필': collectionView('관리 프로필'),
  '설정': { render: renderSettings },
  '커스텀 구성': collectionView('커스텀 구성'),
  '토큰': collectionView('토큰'),
  '앱 및 확장 프로그램': { render: renderApps },
  '커넥터': collectionView('커넥터'),
  ...Object.fromEntries(Object.keys(LIST_PAGES).map((path) => [path, listView(path)])),
  '보고서': listView('보고서/개요'),
};
