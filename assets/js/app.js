// 관리 콘솔 연습 시뮬레이터 — 셸(상단바/사이드바/라우팅/상태) 및 공용 부품
import { SECTIONS, visibleSections, navTree, flatPaths, firstLeaf, leafOf, findSection, isRestricted } from './nav.js';
import homeView from './views/home.js';
import directoryViews from './views/directory.js';
import miscViews from './views/misc.js';
import chromeViews from './views/chrome.js';
import appsViews from './views/apps.js';
import genaiViews from './views/genai.js';

/* ---------------- 상태 ---------------- */
const STORE_KEY = 'admin-sim:v5';
const POLICY_KEY = 'admin-sim:policies';

const SEED = {
  orgs: [
    { id: 'org-root', name: '연습학교', parent: '', description: '연습학교 최상위 조직' },
    { id: 'org-admin', name: '1.관리자', parent: '연습학교', description: '관리자 계정' },
    { id: 'org-teachers', name: '2.교원', parent: '연습학교', description: '교사 계정' },
    { id: 'org-students', name: '3.학생', parent: '연습학교', description: '학생 계정' },
    { id: 'org-students-1', name: '1학년', parent: '3.학생', description: '-' },
    { id: 'org-students-2', name: '2학년', parent: '3.학생', description: '-' },
    { id: 'org-students-3', name: '3학년', parent: '3.학생', description: '-' },
    { id: 'org-tablets', name: '4.태블릿기기', parent: '연습학교', description: '태블릿 기기 전용' },
    { id: 'org-tablets-t', name: '교사용 태블릿', parent: '4.태블릿기기', description: '-' },
    { id: 'org-tablets-s', name: '학생용 태블릿', parent: '4.태블릿기기', description: '-' },
    { id: 'org-chromebooks', name: '5.크롬북(삭제금지)', parent: '연습학교', description: '크롬북 기기 전용 · 삭제 금지' },
    { id: 'org-chromebooks-1', name: '크롬북 1학년', parent: '5.크롬북(삭제금지)', description: '-' },
    { id: 'org-chromebooks-2', name: '크롬북 2학년', parent: '5.크롬북(삭제금지)', description: '-' },
    { id: 'org-chromebooks-3', name: '크롬북 3학년', parent: '5.크롬북(삭제금지)', description: '-' },
  ],
  users: [
    { id: 'admin-locked', firstName: '관리자', lastName: '최고', email: 'admin@school.sen.ms.kr', org: '1.관리자', status: '보호됨' },
    { id: 'u-teacher1', firstName: '수진', lastName: '이', email: 'teacher01@school.sen.ms.kr', org: '2.교원', status: '활성' },
    { id: 'u-student1', firstName: '하늘', lastName: '김', email: 'student01@school.sen.ms.kr', org: '3.학생', status: '활성' },
  ],
  groups: [
    { id: 'g-all', name: '연습학교', email: 'all@school.sen.ms.kr', description: 'Default audience with all users in your organization (updated automatically)', memberCount: 1372, members: [] },
    { id: 'g-teachers', name: '연습 교사그룹', email: 'teachers@school.sen.ms.kr', description: '', memberCount: 1, members: ['admin-locked'] },
  ],
};

const PROFILES = {
  sen: { name: '연습학교 관리자', email: 'admin@school.sen.ms.kr', short: '학교', role: '학교 관리자(센스쿨)' },
  full: { name: '최고 관리자', email: 'superadmin@school.sen.ms.kr', short: '최고', role: '최고 관리자' },
};

const state = {
  signedIn: false,
  mode: 'sen',
  section: 'home',
  link: '',
  query: '',
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 860 : true,
  railOpen: typeof window !== 'undefined' && window.innerWidth >= 1400,
  orgs: SEED.orgs.slice(),
  users: SEED.users.slice(),
  groups: SEED.groups.slice(),
  local: {},
  expanded: {},
};

let policies = {};

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) {
      state.mode = saved.mode || 'sen';
      state.signedIn = !!saved.signedIn;
      state.orgs = saved.orgs || state.orgs;
      state.users = saved.users || state.users;
      state.groups = saved.groups || state.groups;
    }
    policies = JSON.parse(localStorage.getItem(POLICY_KEY) || '{}');
  } catch { /* 저장 값이 깨졌으면 기본값 사용 */ }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      mode: state.mode, signedIn: state.signedIn, orgs: state.orgs, users: state.users, groups: state.groups,
    }));
  } catch { /* 저장 실패는 연습에 영향 없음 */ }
}
function savePolicies() {
  try { localStorage.setItem(POLICY_KEY, JSON.stringify(policies)); } catch { /* noop */ }
}

/* ---------------- 유틸 ---------------- */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
export function icon(name, size = 20) {
  const cls = size <= 16 ? 'msi s16' : size <= 18 ? 'msi s18' : size <= 20 ? 'msi s20' : 'msi';
  return `<span class="${cls}" aria-hidden="true">${esc(name)}</span>`;
}
const $ = (sel) => document.querySelector(sel);

/* ---------------- 공용 부품 ---------------- */
function appliedOu() {
  return `<small class="applied-ou">'${esc(currentOu())}'에 적용됨</small>`;
}
function crumb(text) {
  return `<div class="page-crumb">${esc(text)}</div>`;
}
function currentOu() {
  return state.local.selectedOu || '연습학교';
}
/** 조직 단위 트리를 depth 순서대로 펼친 목록 */
function orgRows(parentName = '', depth = 0) {
  return state.orgs
    .filter((o) => (parentName ? o.parent === parentName : !o.parent))
    .flatMap((o) => [{ ...o, depth, hasChildren: state.orgs.some((c) => c.parent === o.name) }, ...orgRows(o.name, depth + 1)]);
}

function ouPicker(selected) {
  const active = selected || currentOu();
  const rows = orgRows();
  return `<aside class="org-tree compact">
    <div class="ou-picker-tabs">
      <button data-toast="브라우저 탭">브라우저</button>
      <button data-toast="사용자 탭">사용자</button>
      <button data-toast="그룹 탭">그룹</button>
      <button class="active">조직 단위</button>
    </div>
    <label class="ou-search tight">${icon('search', 16)}<input placeholder="조직 단위 검색"></label>
    ${rows.map((o) => `<button class="${o.depth === 0 ? 'tree-root' : 'tree-child'} ${active === o.name ? 'selected' : ''}"
        style="padding-left:${12 + o.depth * 16}px" data-set="selectedOu::${esc(o.name)}">
        ${o.hasChildren ? icon('arrow_drop_down', 16) : '<span class="ou-spacer"></span>'}${esc(o.name)}
      </button>`).join('')}
  </aside>`;
}
function adminListPage({ title, breadcrumb, description, columns = [], rows = [], actionLabel, emptyHint }) {
  return `<div class="section-page wide admin-page">
    ${crumb(breadcrumb ? `${breadcrumb} > ${title}` : title)}
    <div class="page-title-row">
      <div><h1>${esc(title)}</h1>${description ? `<p class="page-desc">${esc(description)}</p>` : ''}</div>
      ${actionLabel ? `<button class="primary-button" data-toast="${esc(actionLabel)}">${icon('add', 18)} ${esc(actionLabel)}</button>` : ''}
    </div>
    <div class="data-panel flat">
      ${emptyHint ? `<div class="empty-hint">${esc(emptyHint)}</div>` : ''}
      <table class="admin-table">
        <thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((cell, i) => `<td>${i === 0 ? `<b class="blue-text">${esc(cell)}</b>` : esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  </div>`;
}
/* ---------------- 어디서나 수정 가능한 값 ---------------- */
/** 저장된 값이 있으면 그 값, 없으면 기본값 */
function setting(scope, name, fallback = '') {
  const saved = policies[scope]?.[name];
  return saved === undefined ? fallback : saved;
}
/**
 * 클릭하면 편집 다이얼로그가 열리는 값.
 * options 를 주지 않으면 '사용 / 사용 안함' 두 가지로 처리합니다.
 */
function editable({ scope, name, value = '', options, title, section, className = '' }) {
  const list = options && options.length ? options : ['사용', '사용 안함'];
  const current = setting(scope, name, value);
  const payload = esc(JSON.stringify({ s: scope, n: name, o: list, d: value, t: section || title || name }));
  const changed = policies[scope]?.[name] !== undefined;
  return `<button type="button" class="editable ${className} ${changed ? 'changed' : ''}" data-edit="${payload}" title="클릭하여 변경">
    <span>${esc(current || '설정되지 않음')}</span>${icon('edit', 16)}
  </button>`;
}

function policyValue(scope, item) {
  const saved = policies[scope]?.[item.name];
  if (saved !== undefined) return saved;
  return item.value || (item.inheritance === '로컬 단위로 적용됨' ? '로컬로 구성됨' : 'Google 기본값');
}
const PLATFORM_ICONS = `${icon('desktop_windows', 16)}${icon('laptop_chromebook', 16)}${icon('phone_android', 16)}`;
function policyTable({ scope, categories = [] }) {
  return `<div class="chrome-ext-settings">
    <div class="settings-table">
      <div class="settings-row header"><b>설정</b><b>구성</b><b>상속</b><b>지원 플랫폼</b></div>
      ${categories.map((category) => `
        <div class="settings-category">
          <div class="settings-row category-header"><b>${esc(category.title)}</b></div>
          ${category.items.map((item) => {
            const saved = policies[scope]?.[item.name] !== undefined;
            const inheritance = saved ? '로컬 단위로 적용됨' : item.inheritance;
            return `<button class="settings-row" data-policy="${esc(scope)}::${esc(item.name)}">
              <span>${esc(item.name)}</span>
              <span class="${saved || item.inheritance === '로컬 단위로 적용됨' ? 'saved-value' : ''}">${esc(policyValue(scope, item))}</span>
              <span>${esc(inheritance)}</span>
              <span class="platforms">${PLATFORM_ICONS}</span>
            </button>`;
          }).join('')}
        </div>`).join('')}
    </div>
  </div>`;
}

/* ---------------- ctx ---------------- */
const ctx = {
  get state() { return state; },
  esc,
  icon,
  crumb,
  appliedOu,
  ouPicker,
  adminListPage,
  policyTable,
  currentOu,
  orgRows,
  setting,
  editable,
  local: (key, fallback) => (state.local[key] === undefined ? fallback : state.local[key]),
  setLocal: (key, value) => { state.local[key] = value; renderView(); },
  toast,
  navigate,
  policy: (scope, name, fallback) => (policies[scope]?.[name] ?? fallback),
  openModal,
};

/* ---------------- 토스트 ---------------- */
let toastTimer;
function toast(message) {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast" role="status">${icon('info', 20)}<span>${esc(message)}</span><button data-close-toast>확인</button></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ''; }, 4200);
}
function practiceToast(label) {
  toast(`연습 모드: “${label}” — 실제 관리 콘솔에는 반영되지 않습니다.`);
}

/* ---------------- 라우팅 ---------------- */
function navigate(sectionId, path) {
  const section = findSection(sectionId) || findSection('home');
  state.section = section.id;
  state.link = path !== undefined && path !== '' ? path : firstLeaf(section, state.mode);
  state.query = '';
  if ($('#search-input')) $('#search-input').value = '';
  state.expanded = { [section.id]: true };
  if (window.innerWidth < 860) state.sidebarOpen = false;
  window.scrollTo({ top: 0 });
  const hash = `#/${section.id}${state.link ? `/${state.link.split('/').map(encodeURIComponent).join('/')}` : ''}`;
  if (location.hash !== hash) { suppressHash = true; location.hash = hash; }
  render();
}
let suppressHash = false;
function readHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });
  if (!parts[0]) return;
  const section = findSection(parts[0]);
  if (!section) return;
  state.section = section.id;
  state.link = parts.slice(1).filter(Boolean).join('/') || firstLeaf(section, state.mode);
  state.expanded = { [section.id]: true };
}

/* ---------------- 렌더: 사이드바 ---------------- */
// 현재 경로가 node.path 아래에 있는지
const onPath = (path) => state.link === path || String(state.link).startsWith(`${path}/`);

function renderNavNodes(sectionId, nodes, depth) {
  const isActiveSection = state.section === sectionId;
  return `<div class="subitems ${depth > 0 ? 'nested' : ''}">${nodes.map((node) => {
    const hasChildren = node.children.length > 0;
    const inPath = isActiveSection && onPath(node.path);
    const open = hasChildren && (inPath || state.expanded[`${sectionId}:${node.path}`]);
    const current = isActiveSection && state.link === node.path;
    const cls = [
      hasChildren ? 'has-children' : '',
      current ? 'active' : '',
      hasChildren && inPath ? 'expanded' : '',
    ].filter(Boolean).join(' ');
    return `<div class="nav-branch depth-${depth}">
      <button class="${cls}" data-nav="${sectionId}::${esc(node.path)}">
        ${hasChildren ? `<span class="nav-chevron">${icon(open ? 'arrow_drop_down' : 'arrow_right', 18)}</span>` : ''}
        <span class="nav-label">${esc(node.name)}</span>
      </button>
      ${open ? renderNavNodes(sectionId, node.children, depth + 1) : ''}
    </div>`;
  }).join('')}</div>`;
}

function renderNav() {
  const sections = visibleSections(state.mode);
  $('#nav-list').innerHTML = sections.map((section) => {
    const tree = navTree(section, state.mode);
    const isActive = state.section === section.id;
    const open = tree.length > 0 && (state.expanded[section.id] || isActive);
    const chevron = tree.length === 0
      ? ''
      : `<span class="nav-chevron">${icon(open ? 'arrow_drop_down' : 'arrow_right', 18)}</span>`;
    return `<div class="nav-group">
      <button class="nav-item ${isActive ? (tree.length ? 'active-parent' : 'active') : ''} ${tree.length ? '' : 'no-chevron'}"
              data-nav="${section.id}::">
        ${chevron}${icon(section.icon, 22)}<span class="nav-label">${esc(section.title)}</span>
        ${section.blueDot ? '<i class="blue-dot"></i>' : ''}
        ${section.badge ? `<em>${esc(section.badge)}</em>` : ''}
      </button>
      ${open ? renderNavNodes(section.id, tree, 0) : ''}
    </div>`;
  }).join('');
}

/* ---------------- 렌더: 본문 ---------------- */
const VIEW_MAP = {
  directory: directoryViews,
  chrome: chromeViews,
  apps: appsViews,
  ai: genaiViews,
};

function renderView() {
  const root = $('#content');
  const section = findSection(state.section) || findSection('home');

  if (state.query.trim()) { root.innerHTML = searchResults(state.query); return; }

  if (isRestricted(section.id, state.link, state.mode)) {
    root.innerHTML = deniedPage(section);
    return;
  }

  let html = '';
  let view;
  if (section.id === 'home') {
    html = homeView.render(ctx);
    view = homeView;
  } else {
    const registry = VIEW_MAP[section.id] || {};
    const sectionViews = miscViews[section.id] || {};
    const leaf = leafOf(state.link);
    view = registry[state.link] || sectionViews[state.link]
      || registry[leaf] || sectionViews[leaf]
      || sectionViews['*'];
    if (view) {
      html = view.render(ctx);
    } else {
      html = adminListPage({
        title: leaf || section.title,
        breadcrumb: [section.title, ...String(state.link).split('/').slice(0, -1)].join(' > '),
        description: section.subtitle,
        columns: ['이름', '상태', '적용', '비고'],
        rows: flatPaths(section, state.mode).slice(0, 6).map((l, i) => [leafOf(l), i % 2 ? '사용 중' : '준비됨', '연습학교', '예시']),
        actionLabel: '항목 추가',
      });
    }
  }
  root.innerHTML = html;
  if (view && typeof view.mount === 'function') view.mount(root, ctx);
}

function deniedPage(section) {
  return `<div class="section-page admin-page"><div class="denied">
    ${icon('lock', 48)}
    <h1>이 계정에는 권한이 없습니다</h1>
    <p>‘${esc(section.title)}${state.link ? ` &gt; ${esc(state.link)}` : ''}’ 메뉴는 <b>최고 관리자</b>만 사용할 수 있습니다.<br>
    센스쿨(SEN) 학교 관리자 계정에는 이 권한이 위임되어 있지 않습니다.</p>
    <p class="pill">상단의 <b>최고관리자</b> 버튼을 누르면 이 메뉴가 어떻게 보이는지 비교해 볼 수 있습니다.</p>
  </div></div>`;
}

function searchResults(query) {
  const q = query.trim().toLowerCase();
  const sections = visibleSections(state.mode).filter((s) => (
    `${s.title} ${s.subtitle || ''} ${flatPaths(s, state.mode).join(' ')}`.toLowerCase().includes(q)
  ));
  const hiddenHits = state.mode === 'sen'
    ? SECTIONS.filter((s) => !s.sen && `${s.title} ${s.subtitle || ''} ${flatPaths(s, 'full').join(' ')}`.toLowerCase().includes(q))
    : [];
  return `<div class="search-results">
    <p class="eyebrow">통합 검색</p>
    <h1>검색 결과</h1>
    <p>${sections.length}개의 메뉴를 찾았습니다.</p>
    <div>${sections.map((s) => `
      <button data-nav="${s.id}::${esc(firstLeaf(s, state.mode))}">
        <span class="section-icon">${icon(s.icon, 21)}</span>
        <span><strong>${esc(s.title)}</strong><small>${esc(s.subtitle || '')}</small></span>
        ${icon('chevron_right', 20)}
      </button>`).join('')}
    </div>
    ${!sections.length ? `<div class="empty-state">${icon('search', 24)}<strong>일치하는 메뉴가 없습니다</strong></div>` : ''}
    ${hiddenHits.length ? `<div class="practice-strip" style="margin-top:20px">${icon('lock', 20)}
      <span><b>권한 밖 메뉴 ${hiddenHits.length}개</b>가 검색어와 일치합니다 — ${esc(hiddenHits.map((s) => s.title).join(', '))}.
      센스쿨 학교 관리자 계정에서는 표시되지 않습니다.</span>
      <button data-mode="full">최고관리자로 보기</button></div>` : ''}
  </div>`;
}

/* ---------------- 모달 ---------------- */
let modalState = null;
function openModal(kind, options) {
  modalState = { kind, options: options || {} };
  renderModal();
}
function closeModal() { modalState = null; $('#modal-root').innerHTML = ''; }

function modalShell(title, description, body) {
  return `<div class="modal-backdrop" data-backdrop>
    <section class="modal" role="dialog" aria-modal="true">
      <header>
        <div><p class="eyebrow">연습 모드</p><h2>${esc(title)}</h2><p>${esc(description)}</p></div>
        <button class="icon-button" data-close-modal aria-label="닫기">${icon('close', 22)}</button>
      </header>
      ${body}
    </section>
  </div>`;
}

function renderModal() {
  const root = $('#modal-root');
  if (!modalState) { root.innerHTML = ''; return; }
  const { kind, options } = modalState;
  if (kind === 'org') {
    root.innerHTML = modalShell('조직 단위 만들기', '조직 구조를 구성합니다.', `
      <form class="practice-form" data-form="org">
        <label><span>조직 단위 이름 *</span><input name="name" required autofocus></label>
        <label><span>상위 조직 단위</span><select name="parent">${state.orgs.map((o) => `<option ${o.name === (options.parent || '연습학교') ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
        <label><span>설명</span><textarea name="description"></textarea></label>
        <div class="form-actions"><button type="button" data-close-modal>취소</button><button type="submit">조직 단위 만들기</button></div>
      </form>`);
  } else if (kind === 'user') {
    root.innerHTML = modalShell('새 사용자 계정 만들기', '이름, 계정 주소, 조직 단위를 지정합니다.', `
      <form class="practice-form" data-form="user">
        <div class="form-row">
          <label><span>성 *</span><input name="lastName" required></label>
          <label><span>이름 *</span><input name="firstName" required autofocus></label>
        </div>
        <label><span>기본 이메일 *</span><div class="email-input"><input name="username" required pattern="[a-zA-Z0-9._-]+"><b>@school.sen.ms.kr</b></div></label>
        <label><span>조직 단위</span><select name="org">${state.orgs.map((o) => `<option ${o.name === '3.학생' ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
        <div class="form-actions"><button type="button" data-close-modal>취소</button><button type="submit">사용자 추가</button></div>
      </form>`);
  } else if (kind === 'group') {
    root.innerHTML = modalShell('새 그룹 만들기', '그룹 주소와 구성원을 지정합니다.', `
      <form class="practice-form" data-form="group">
        <label><span>그룹 이름 *</span><input name="name" required autofocus></label>
        <label><span>그룹 이메일 *</span><div class="email-input"><input name="address" required pattern="[a-zA-Z0-9._-]+"><b>@school.sen.ms.kr</b></div></label>
        <label><span>그룹 설명</span><textarea name="description"></textarea></label>
        <fieldset class="member-picker"><legend>구성원 선택</legend>
          ${state.users.map((u) => `<label><input type="checkbox" name="members" value="${esc(u.id)}"><span><strong>${esc(u.lastName)}${esc(u.firstName)}</strong><small>${esc(u.email)}</small></span></label>`).join('')}
        </fieldset>
        <div class="form-actions"><button type="button" data-close-modal>취소</button><button type="submit">그룹 만들기</button></div>
      </form>`);
  } else if (kind === 'policy') {
    const { scope, name, current, options: opts = [] } = options;
    root.innerHTML = modalShell(options.displayName || name, `${options.sectionLabel || '설정'} · ${currentOu()}에 적용`, `
      <form class="policy-body" data-form="policy" data-scope="${esc(scope)}" data-name="${esc(name)}">
        <fieldset>
          <legend>구성</legend>
          ${opts.map((option, i) => `<label><input type="radio" name="value" value="${esc(option)}" ${option === current || (!opts.includes(current) && i === 0) ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}
        </fieldset>
        <div class="policy-preview"><span>적용 대상</span><span>${esc(currentOu())} · ${esc(PROFILES[state.mode].role)}</span></div>
        <div class="form-actions">
          <button type="button" data-policy-reset>기본값으로 되돌리기</button>
          <button type="button" data-close-modal>취소</button>
          <button type="submit">저장</button>
        </div>
      </form>`);
  }
}

/* ---------------- 이벤트 위임 ---------------- */
document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-signin],[data-mode],[data-nav],[data-toast],[data-set],[data-policy],[data-edit],[data-modal],[data-close-modal],[data-backdrop],[data-close-toast],[data-policy-reset],[data-action]');
  if (!target) return;

  if (target.hasAttribute('data-signin')) {
    state.mode = target.getAttribute('data-signin');
    state.signedIn = true;
    save();
    render();
    return;
  }
  if (target.hasAttribute('data-mode')) {
    const mode = target.getAttribute('data-mode');
    if (mode !== state.mode) {
      state.mode = mode;
      const section = findSection(state.section);
      if (!section || isRestricted(section.id, state.link, mode)) { state.section = 'home'; state.link = ''; }
      save();
      toast(mode === 'sen'
        ? '센스쿨(SEN) 학교 관리자 권한으로 전환했습니다. 위임되지 않은 메뉴는 사라집니다.'
        : '최고 관리자 권한으로 전환했습니다. 모든 메뉴가 표시됩니다.');
      render();
    }
    return;
  }
  if (target.hasAttribute('data-nav')) {
    event.preventDefault();
    const [sectionId, link] = target.getAttribute('data-nav').split('::');
    const section = findSection(sectionId);
    if (section && state.section === sectionId && !link && (section.links || []).length) {
      state.expanded[sectionId] = !state.expanded[sectionId];
      renderNav();
      return;
    }
    navigate(sectionId, link);
    return;
  }
  if (target.hasAttribute('data-modal')) {
    openModal(target.getAttribute('data-modal'), { parent: target.dataset.parent });
    return;
  }
  if (target.hasAttribute('data-edit')) {
    event.preventDefault();
    let payload;
    try { payload = JSON.parse(target.getAttribute('data-edit')); } catch { return; }
    const options = payload.o && payload.o.length ? payload.o : ['사용', '사용 안함'];
    openModal('policy', {
      scope: payload.s,
      name: payload.n,
      displayName: payload.n.includes(' · ') ? payload.n.split(' · ').slice(-1)[0] : payload.n,
      sectionLabel: payload.t,
      current: setting(payload.s, payload.n, payload.d),
      options,
    });
    return;
  }
  if (target.hasAttribute('data-policy')) {
    const [scope, name] = target.getAttribute('data-policy').split('::');
    const item = findPolicyItem(scope, name);
    openModal('policy', {
      scope,
      name,
      sectionLabel: item?.sectionLabel,
      current: policies[scope]?.[name] ?? item?.value ?? 'Google 기본값',
      options: item?.options?.length ? item.options : ['Google 기본값 사용', `${name} 사용 설정`, `${name} 사용 중지`],
    });
    return;
  }
  if (target.hasAttribute('data-set')) {
    const [key, ...rest] = target.getAttribute('data-set').split('::');
    state.local[key] = rest.join('::');
    renderView();
    return;
  }
  if (target.hasAttribute('data-close-modal') || target.hasAttribute('data-backdrop')) {
    if (target.hasAttribute('data-backdrop') && event.target !== target) return;
    closeModal();
    return;
  }
  if (target.hasAttribute('data-policy-reset')) {
    const form = target.closest('form');
    const scope = form.dataset.scope;
    if (policies[scope]) { delete policies[scope][form.dataset.name]; savePolicies(); }
    closeModal();
    toast(`‘${form.dataset.name}’을(를) 기본값으로 되돌렸습니다.`);
    renderView();
    return;
  }
  if (target.hasAttribute('data-close-toast')) { $('#toast-root').innerHTML = ''; return; }
  if (target.hasAttribute('data-toast')) {
    event.preventDefault();
    practiceToast(target.getAttribute('data-toast'));
    return;
  }
  if (target.hasAttribute('data-action')) {
    event.preventDefault();
    handleAction(target.getAttribute('data-action'), target);
  }
});

function handleAction(action, target) {
  if (action === 'delete-user') {
    const id = target.dataset.id;
    if (id === 'admin-locked') { toast('초기 관리자 계정은 보호됩니다.'); return; }
    state.users = state.users.filter((u) => u.id !== id);
    save(); toast('사용자 계정을 삭제했습니다.'); renderView();
  } else if (action === 'delete-group') {
    const id = target.dataset.id;
    if (id === 'g-all' || id === 'g-teachers') { toast('기본 공유 대상 그룹은 보호됩니다.'); return; }
    state.groups = state.groups.filter((g) => g.id !== id);
    save(); toast('그룹을 삭제했습니다.'); renderView();
  } else if (action === 'delete-org') {
    const id = target.dataset.id;
    const org = state.orgs.find((o) => o.id === id);
    if (!org) return;
    if (!org.parent) { toast('최상위 조직 단위는 삭제할 수 없습니다. 실제 관리 콘솔도 동일합니다.'); return; }
    const doomed = new Set([org.name]);
    let grew = true;
    while (grew) {
      grew = false;
      state.orgs.forEach((o) => {
        if (o.parent && doomed.has(o.parent) && !doomed.has(o.name)) { doomed.add(o.name); grew = true; }
      });
    }
    const removed = doomed.size;
    state.orgs = state.orgs.filter((o) => !doomed.has(o.name));
    if (state.local.selectedOu && doomed.has(state.local.selectedOu)) state.local.selectedOu = '연습학교';
    save();
    toast(removed > 1
      ? `조직 단위 ‘${org.name}’와 하위 조직 단위 ${removed - 1}개를 삭제했습니다.`
      : `조직 단위 ‘${org.name}’를 삭제했습니다.`);
    renderView();
  }
}

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const kind = form.dataset.form;
  if (kind === 'org') {
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    state.orgs.push({ id: uid(), name, parent: String(data.get('parent') || '연습학교'), description: String(data.get('description') || '').trim() || '-' });
    toast(`조직 단위 “${name}”을 만들었습니다.`);
  } else if (kind === 'user') {
    const username = String(data.get('username') || '').replace(/@.*/, '');
    state.users.push({
      id: uid(),
      firstName: String(data.get('firstName') || ''),
      lastName: String(data.get('lastName') || ''),
      email: `${username}@school.sen.ms.kr`,
      org: String(data.get('org') || '연습학교'),
      status: '활성',
    });
    toast(`사용자 “${username}@school.sen.ms.kr”을 만들었습니다.`);
  } else if (kind === 'group') {
    const address = String(data.get('address') || '').replace(/@.*/, '');
    const members = data.getAll('members').map(String);
    state.groups.push({
      id: uid(),
      name: String(data.get('name') || ''),
      email: `${address}@school.sen.ms.kr`,
      description: String(data.get('description') || ''),
      members,
      memberCount: members.length,
    });
    toast(`그룹 “${address}@school.sen.ms.kr”을 만들었습니다.`);
  } else if (kind === 'policy') {
    const scope = form.dataset.scope;
    const name = form.dataset.name;
    const value = String(data.get('value') || '');
    policies[scope] = policies[scope] || {};
    policies[scope][name] = value;
    savePolicies();
    toast(`‘${name}’ 설정을 저장했습니다. (연습용)`);
  }
  save();
  closeModal();
  renderView();
});

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

/* 정책 카탈로그에서 항목 찾기 (지연 로딩) */
let policyCatalogs = null;
async function loadPolicyCatalogs() {
  if (policyCatalogs) return policyCatalogs;
  const [user, device, guest, apps] = await Promise.all([
    import('./data/chrome-user-policies.js'),
    import('./data/chrome-device-policies.js'),
    import('./data/chrome-guest-session-policies.js'),
    import('./data/chrome-apps-extension-settings.js'),
  ]);
  policyCatalogs = {
    'chrome-user': user.chromePoliciesByTab['사용자 및 브라우저 설정'] || user.chromeUserPolicyCategories,
    'chrome-device': device.chromeDevicePolicyCategories,
    'chrome-guest': guest.chromeGuestSessionCategories,
    'chrome-apps-ext': apps.chromeAppsExtensionSettingsCategories,
  };
  return policyCatalogs;
}
function findPolicyItem(scope, name) {
  const categories = policyCatalogs?.[scope] || [];
  for (const category of categories) {
    const item = category.items.find((p) => p.name === name);
    if (item) return { ...item, sectionLabel: category.title };
  }
  return null;
}

/* ---------------- 상단바 / 셸 ---------------- */
function renderShell() {
  const profile = PROFILES[state.mode];
  const avatar = $('#profile-button');
  avatar.textContent = profile.short;
  avatar.classList.toggle('full', state.mode === 'full');
  avatar.title = `${profile.name} · ${profile.email}`;
  document.querySelectorAll('.mode-switch button').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  });
  const workspace = $('#workspace');
  workspace.classList.toggle('sidebar-collapsed', !state.sidebarOpen);
  workspace.classList.toggle('rail-collapsed', !state.railOpen);
  workspace.classList.toggle('rail-open', state.railOpen);
}

function render() {
  $('#signin').hidden = state.signedIn;
  $('#app').hidden = !state.signedIn;
  if (!state.signedIn) return;
  renderShell();
  renderNav();
  renderView();
}

/* ---------------- 초기화 ---------------- */
$('#menu-toggle').addEventListener('click', () => { state.sidebarOpen = !state.sidebarOpen; renderShell(); });
$('#rail-toggle').addEventListener('click', () => { state.railOpen = !state.railOpen; renderShell(); });
$('#profile-button').addEventListener('click', () => {
  const profile = PROFILES[state.mode];
  toast(`${profile.name} · ${profile.email} — 권한: ${profile.role}`);
});
$('#search-input').addEventListener('input', (event) => {
  state.query = event.target.value;
  renderView();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalState) closeModal();
});
window.addEventListener('hashchange', () => {
  if (suppressHash) { suppressHash = false; return; }
  readHash();
  render();
});

load();
readHash();
loadPolicyCatalogs();
render();
