// 관리 콘솔 연습 시뮬레이터 — 셸(상단바/사이드바/라우팅/상태) 및 공용 부품
import { SECTIONS, visibleSections, navTree, flatPaths, firstLeaf, leafOf, findSection, isRestricted } from './nav.js';
import homeView from './views/home.js';
import directoryViews from './views/directory.js';
import miscViews from './views/misc.js';
import chromeViews, { SAMPLE_APPS } from './views/chrome.js';
import appsViews from './views/apps.js';
import genaiViews from './views/genai.js';
import { translateDom } from './i18n.js';

/* ---------------- 상태 ---------------- */
const STORE_KEY = 'admin-sim:v5';
const POLICY_KEY = 'admin-sim:policies';

const SEED = {
  // 실제 콘솔을 새로 개설했을 때처럼 최상위 조직 단위와 관리자 계정만 둡니다.
  orgs: [
    { id: 'org-root', name: '연습학교', parent: '', description: '연습학교' },
  ],
  users: [
    { id: 'admin-locked', firstName: '관리자', lastName: '최고', email: 'admin@practice.senedu.kr', org: '연습학교', status: '활성' },
  ],
  groups: [],
  apps: [],
  records: {},
};

const PROFILES = {
  sen: { name: '연습학교 관리자', email: 'admin@practice.senedu.kr', short: '학교', role: '학교 관리자(센스쿨)' },
  full: { name: '최고 관리자', email: 'superadmin@practice.senedu.kr', short: '최고', role: '최고 관리자' },
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
  apps: SEED.apps.map((a) => ({ ...a })),
  records: {},
  local: {},
  expanded: {},
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('admin-sim:lang')) || 'ko',
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
      state.apps = saved.apps || state.apps;
      state.records = saved.records || {};
    }
    policies = JSON.parse(localStorage.getItem(POLICY_KEY) || '{}');
  } catch { /* 저장 값이 깨졌으면 기본값 사용 */ }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      mode: state.mode, signedIn: state.signedIn, orgs: state.orgs, users: state.users, groups: state.groups, apps: state.apps, records: state.records,
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
/* ---------------- 추가·삭제가 가능한 목록(컬렉션) ---------------- */
/** 화면이 렌더될 때 등록되는 스키마 — 추가 다이얼로그가 이걸 보고 양식을 만든다 */
const SCHEMAS = {};

function collection(key) {
  return state.records[key] || [];
}

/** 목록 화면을 그리지 않고 추가 양식만 등록한다(다른 화면의 '추가' 버튼용) */
function defineList(key, def) {
  SCHEMAS[key] = def;
  return '';
}

function fieldInput(field) {
  const id = `f-${field.name}`;
  if (field.type === 'select') {
    const options = typeof field.options === 'function' ? field.options() : (field.options || []);
    return `<select id="${id}" name="${esc(field.name)}">${options.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
  }
  if (field.type === 'textarea') {
    return `<textarea id="${id}" name="${esc(field.name)}" placeholder="${esc(field.placeholder || '')}"></textarea>`;
  }
  if (field.type === 'checkbox') {
    return `<label class="switch-line"><input type="checkbox" name="${esc(field.name)}" value="예"><span><strong>${esc(field.checkboxLabel || field.label)}</strong></span></label>`;
  }
  return `<input id="${id}" name="${esc(field.name)}" type="${esc(field.type || 'text')}"
    ${field.required ? 'required' : ''} placeholder="${esc(field.placeholder || '')}" autocomplete="off">`;
}

/**
 * 실제 콘솔의 목록 화면 한 장을 그린다.
 * key 로 구분되는 컬렉션에 항목을 추가/삭제할 수 있고, 내용은 브라우저에 저장된다.
 */
function listPage(options) {
  const {
    key, title, breadcrumb, description,
    columns = [], fields = [], addLabel = '추가',
    emptyTitle, emptyHint, fab = true, toolbar = '', note = '',
    ouPicker: withOu = false,
  } = options;
  SCHEMAS[key] = { title, addLabel, fields, columns };
  const rows = collection(key);
  const table = `<div class="data-panel flat list-panel">
      <div class="action-strip">
        <strong>${esc(title)} | ${rows.length ? `${rows.length}개 표시` : '결과가 없음'}</strong>
        <button data-add="${esc(key)}">${esc(addLabel)}</button>
        <button data-toast="다운로드">다운로드</button>
      </div>
      <div class="filter-strip"><button data-toast="필터 추가">${icon('add', 17)} 필터 추가</button></div>
      ${rows.length ? `<div class="table-wrap"><table class="admin-table">
        <thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th class="col-actions"></th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
          ${columns.map((c, i) => `<td>${i === 0
            ? `<b class="blue-text">${esc(row[c.key] || '—')}</b>`
            : (c.editable
              ? editable({ scope: `list:${key}`, name: `${row[c.key] || row.id} · ${c.label}`, value: row[c.key] || '', options: c.options, section: title })
              : esc(row[c.key] || '—'))}</td>`).join('')}
          <td class="col-actions"><button class="row-action danger" data-action="delete-record" data-key="${esc(key)}" data-id="${esc(row.id)}" title="삭제">${icon('delete', 18)}</button></td>
        </tr>`).join('')}</tbody>
      </table></div>`
      : `<div class="list-empty">
          ${icon('inbox', 40)}
          <strong>${esc(emptyTitle || '아직 등록된 항목이 없습니다')}</strong>
          <p>${esc(emptyHint || `‘${addLabel}’를 눌러 직접 만들어 보세요. 연습 내용은 이 브라우저에만 저장됩니다.`)}</p>
          <button class="primary-button" data-add="${esc(key)}">${icon('add', 18)} ${esc(addLabel)}</button>
        </div>`}
      ${rows.length ? `<div class="table-footer"><span>페이지당 행 수: 20</span><span>1-${rows.length} / ${rows.length}</span></div>` : ''}
      ${fab ? `<button class="fab-yellow" data-add="${esc(key)}" aria-label="${esc(addLabel)}" title="${esc(addLabel)}">${icon('add', 24)}</button>` : ''}
    </div>`;

  return `<div class="section-page wide admin-page">
    ${crumb(breadcrumb ? `${breadcrumb} > ${title}` : title)}
    <div class="page-title-row">
      <div><h1>${esc(title)}</h1>${description ? `<p class="page-desc">${esc(description)}</p>` : ''}</div>
      <button class="primary-button" data-add="${esc(key)}">${icon('add', 18)} ${esc(addLabel)}</button>
    </div>
    ${toolbar}
    ${withOu ? `<div class="directory-layout">${ouPicker(currentOu())}${table}</div>` : table}
    ${note ? `<p class="page-desc" style="margin-top:14px">${note}</p>` : ''}
  </div>`;
}

/** 예전 방식(읽기 전용 표) — 통계·안내용 화면에서만 사용 */
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
  listPage,
  collection,
  defineList,
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
  translateDom(root, state.lang);
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
  translateDom($('#nav-list'), state.lang);
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
  translateDom(root, state.lang);
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
  translateDom($('#modal-root'), state.lang);
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
        <label><span>기본 이메일 *</span><div class="email-input"><input name="username" required pattern="[a-zA-Z0-9._-]+"><b>@practice.senedu.kr</b></div></label>
        <label><span>조직 단위</span><select name="org">${state.orgs.map((o) => `<option ${o.name === '3.학생' ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
        <div class="form-actions"><button type="button" data-close-modal>취소</button><button type="submit">사용자 추가</button></div>
      </form>`);
  } else if (kind === 'group') {
    root.innerHTML = modalShell('새 그룹 만들기', '그룹 주소와 구성원을 지정합니다.', `
      <form class="practice-form" data-form="group">
        <label><span>그룹 이름 *</span><input name="name" required autofocus></label>
        <label><span>그룹 이메일 *</span><div class="email-input"><input name="address" required pattern="[a-zA-Z0-9._-]+"><b>@practice.senedu.kr</b></div></label>
        <label><span>그룹 설명</span><textarea name="description"></textarea></label>
        <fieldset class="member-picker"><legend>구성원 선택</legend>
          ${state.users.map((u) => `<label><input type="checkbox" name="members" value="${esc(u.id)}"><span><strong>${esc(u.lastName)}${esc(u.firstName)}</strong><small>${esc(u.email)}</small></span></label>`).join('')}
        </fieldset>
        <div class="form-actions"><button type="button" data-close-modal>취소</button><button type="submit">그룹 만들기</button></div>
      </form>`);
  } else if (kind === 'account') {
    const profile = PROFILES[state.mode];
    const changed = Object.values(policies).reduce((sum, group) => sum + Object.keys(group || {}).length, 0);
    root.innerHTML = `<div class="popover-backdrop" data-backdrop>
      <section class="account-popover" role="dialog" aria-label="계정">
        <div class="account-head">
          <span class="account-avatar ${state.mode === 'full' ? 'full' : 'sen'}">${esc(profile.short)}</span>
          <div>
            <strong>${esc(profile.name)}</strong>
            <small>${esc(profile.email)}</small>
            <em>${esc(profile.role)}</em>
          </div>
        </div>
        <div class="account-stats">
          <span><b>${state.orgs.length}</b>조직 단위</span>
          <span><b>${state.users.length}</b>사용자</span>
          <span><b>${changed}</b>변경한 설정</span>
        </div>
        <p class="account-note">${icon('info', 16)}<span>연습 내용은 <b>이 브라우저에만</b> 저장됩니다. 다른 선생님 화면이나 실제 조직에는 영향이 없습니다.</span></p>
        <div class="account-actions">
          <button class="outline-button" data-modal="reset">${icon('restart_alt', 18)} 연습 데이터 초기화</button>
          <button class="outline-button" data-action="signout">${icon('logout', 18)} 계정 선택으로</button>
        </div>
      </section>
    </div>`;
  } else if (kind === 'reset') {
    root.innerHTML = modalShell('연습 데이터를 초기화할까요?', '이 브라우저에 저장된 연습 내용만 지웁니다.', `
      <div class="practice-form">
        <p style="margin:0;color:#444746;font-size:14px;line-height:1.6">
          직접 만든 조직 단위·사용자·그룹과 바꾼 설정값이 모두 처음 상태로 돌아갑니다.<br>
          다른 사람의 화면이나 실제 관리 콘솔에는 아무 영향이 없습니다.
        </p>
        <div class="form-actions">
          <button type="button" data-close-modal>취소</button>
          <button type="button" class="filled" data-action="reset-confirm">초기화</button>
        </div>
      </div>`);
  } else if (kind === 'legal') {
    const DOCS = {
      privacy: {
        title: '개인정보처리방침',
        body: `
          <p><b>이 시뮬레이터는 개인정보를 일절 수집하지 않습니다.</b></p>
          <p>1. <b>수집하는 정보 없음</b> — 회원가입·로그인이 없으며, 이름·이메일·비밀번호 등 어떤 개인정보도 입력받거나 서버로 전송하지 않습니다. 서버 자체가 없는 정적 웹사이트입니다.</p>
          <p>2. <b>저장 위치</b> — 연습 중 입력한 내용(가상의 사용자·조직 단위·설정값 등)은 <b>사용자 본인 브라우저의 저장공간(localStorage)에만</b> 보관되며, 제작자를 포함해 누구에게도 전송되지 않습니다.</p>
          <p>3. <b>삭제 방법</b> — 화면 우측 상단 프로필 → <b>‘연습 데이터 초기화’</b>를 누르면 모든 연습 내용이 즉시 삭제됩니다. 브라우저의 인터넷 사용 기록 삭제로도 지워집니다.</p>
          <p>4. <b>쿠키·추적 없음</b> — 쿠키, 광고, 방문 분석 도구를 사용하지 않습니다.</p>
          <p>5. <b>주의</b> — 연습 화면에 실제 학생·교직원의 실명이나 실제 계정 정보를 입력하지 않는 것을 권장합니다. 입력하더라도 본인 브라우저 밖으로 나가지 않지만, 공용 기기에서는 사용 후 꼭 초기화해 주세요.</p>
          <p style="color:#5f6368">문의: gajungssamzzang@gmail.com</p>`,
      },
      terms: {
        title: '서비스 약관',
        body: `
          <p>1. <b>목적</b> — 이 사이트는 서울 지역 학교 <b>정보부장 선생님들의 Google 관리 콘솔 연수·연습</b>을 위해 만들어진 비공식 교육용 시뮬레이터입니다.</p>
          <p>2. <b>Google과의 관계 없음</b> — 이 사이트는 <b>Google LLC와 아무런 관련이 없으며</b>, Google이 제작·승인·후원하지 않았습니다. 화면 구성은 오직 교육 목적으로 Google 관리 콘솔의 모습을 재현한 것입니다. Google, Google Workspace, Chrome은 Google LLC의 상표입니다.</p>
          <p>3. <b>가짜 환경</b> — 여기서 바꾸는 모든 설정은 가상의 연습 데이터이며, 실제 학교의 Google Workspace 조직에는 어떤 영향도 주지 않습니다.</p>
          <p>4. <b>무보증</b> — 교육용으로 ‘있는 그대로’ 제공되며, 실제 콘솔과 화면·기능이 다를 수 있습니다. 실제 조직 설정은 반드시 admin.google.com에서 확인하세요.</p>
          <p>5. <b>제작</b> — © Google Certified Trainer &amp; Innovator Sujin Lee</p>
          <p style="color:#5f6368">문의: gajungssamzzang@gmail.com</p>`,
      },
      billing: {
        title: '결제 조건',
        body: `
          <p><b>이 시뮬레이터는 완전 무료입니다.</b></p>
          <p>1. 어떤 요금도 청구하지 않으며, 결제 수단을 입력받는 기능 자체가 없습니다.</p>
          <p>2. 화면에 보이는 ‘결제’, ‘구독’, ‘라이선스’ 메뉴는 실제 Google 관리 콘솔의 모습을 연습하기 위한 <b>가짜 화면</b>이며 실제 결제와 무관합니다.</p>
          <p>3. 이 사이트는 Google LLC와 관련이 없으므로, 실제 Google Workspace 요금·결제는 admin.google.com과 Google의 공식 약관을 따릅니다.</p>
          <p style="color:#5f6368">문의: gajungssamzzang@gmail.com</p>`,
      },
    };
    const DOCS_EN = {
      privacy: {
        title: 'Privacy Policy',
        body: `
          <p><b>This simulator collects no personal information whatsoever.</b></p>
          <p>1. <b>Nothing is collected</b> - there is no sign-up or login, and no name, email, or password is ever sent anywhere. The site is fully static with no server.</p>
          <p>2. <b>Where data lives</b> - anything you enter during practice (fictional users, organizational units, settings) is kept <b>only in your own browser (localStorage)</b> and is never transmitted to anyone, including the creator.</p>
          <p>3. <b>How to delete</b> - open the profile menu (top right) and press <b>'Reset practice data'</b> to erase everything instantly. Clearing browsing data also removes it.</p>
          <p>4. <b>No cookies or tracking</b> - no cookies, ads, or analytics are used.</p>
          <p>5. <b>Note</b> - please avoid typing real student or staff names/accounts. Even though nothing leaves your browser, reset after use on shared devices.</p>
          <p style="color:#5f6368">Contact: gajungssamzzang@gmail.com</p>`,
      },
      terms: {
        title: 'Terms of Service',
        body: `
          <p>1. <b>Purpose</b> - this site is an unofficial training simulator built so that <b>IT-lead teachers of Seoul schools can safely practice the Google Admin console</b>.</p>
          <p>2. <b>No affiliation with Google</b> - this site is <b>not affiliated with Google LLC</b> and is not made, endorsed, or sponsored by Google. The interface imitates the Admin console solely for education. Google, Google Workspace, and Chrome are trademarks of Google LLC.</p>
          <p>3. <b>Fake environment</b> - every setting here is fictional practice data and has no effect on any real Google Workspace organization.</p>
          <p>4. <b>No warranty</b> - provided "as is" for education; screens may differ from the real console. Always verify real settings at admin.google.com.</p>
          <p>5. <b>Created by</b> - (c) Google Certified Trainer &amp; Innovator Sujin Lee</p>
          <p style="color:#5f6368">Contact: gajungssamzzang@gmail.com</p>`,
      },
      billing: {
        title: 'Billing Terms',
        body: `
          <p><b>This simulator is completely free.</b></p>
          <p>1. No fees are ever charged, and there is no feature that accepts payment details.</p>
          <p>2. The 'Billing', 'Subscriptions', and 'Licenses' menus are <b>fake screens</b> for practicing the real console layout and have nothing to do with actual payments.</p>
          <p>3. This site is unrelated to Google LLC; real Google Workspace pricing and billing follow admin.google.com and Google's official terms.</p>
          <p style="color:#5f6368">Contact: gajungssamzzang@gmail.com</p>`,
      },
    };
    const doc = (state.lang === 'en' ? DOCS_EN : DOCS)[options.legal] || DOCS.terms;
    root.innerHTML = modalShell(doc.title, '연수용 시뮬레이터 안내 문서', `
      <div class="legal-doc">${doc.body}
        <div class="form-actions"><button type="button" class="filled" data-close-modal>확인</button></div>
      </div>`);
  } else if (kind === 'record') {
    const schema = SCHEMAS[options.key];
    if (!schema) { root.innerHTML = ''; return; }
    root.innerHTML = modalShell(schema.addLabel || '추가', `${schema.title} · ${currentOu()}에 추가됩니다.`, `
      <form class="practice-form" data-form="record" data-key="${esc(options.key)}">
        ${schema.fields.map((f) => (f.type === 'checkbox'
          ? fieldInput(f)
          : `<label><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${fieldInput(f)}${f.help ? `<small class="field-help">${esc(f.help)}</small>` : ''}</label>`)).join('')}
        <div class="form-actions">
          <button type="button" data-close-modal>취소</button>
          <button type="submit">${esc(schema.addLabel || '추가')}</button>
        </div>
      </form>`);
  } else if (kind === 'app-source') {
    root.innerHTML = `<div class="modal-backdrop" data-backdrop>
      <section class="modal app-source" role="dialog" aria-modal="true">
        <header>
          <div><p class="eyebrow">연습 모드</p><h2>앱 및 확장 프로그램 추가</h2><p>어떤 방법으로 추가할지 선택하세요.</p></div>
          <button class="icon-button" data-close-modal aria-label="닫기">${icon('close', 22)}</button>
        </header>
        <div class="source-list">
          <button data-modal="app" data-source="webstore">
            <span class="source-icon store">${icon('apps', 22)}</span>
            <span><strong>Chrome 웹 스토어에서 추가</strong><small>이름으로 검색해 앱·확장 프로그램을 배포합니다</small></span>
            ${icon('chevron_right', 20)}
          </button>
          <button data-modal="app" data-source="url">
            <span class="source-icon url">${icon('language', 22)}</span>
            <span><strong>URL로 추가</strong><small>웹사이트를 웹앱 형태로 기기에 설치합니다</small></span>
            ${icon('chevron_right', 20)}
          </button>
          <button data-modal="app" data-source="id">
            <span class="source-icon id">${icon('build', 22)}</span>
            <span><strong>ID로 추가</strong><small>확장 프로그램 ID와 업데이트 URL을 직접 입력합니다</small></span>
            ${icon('chevron_right', 20)}
          </button>
          <button data-modal="app" data-source="play">
            <span class="source-icon play">${icon('phone_android', 22)}</span>
            <span><strong>Android 앱 추가</strong><small>Managed Google Play에서 앱을 선택합니다</small></span>
            ${icon('chevron_right', 20)}
          </button>
        </div>
      </section>
    </div>`;
  } else if (kind === 'app') {
    const source = options.source || 'webstore';
    const SOURCES = {
      webstore: { title: 'Chrome 웹 스토어에서 추가', hint: '앱 이름으로 검색합니다. 연습용이므로 실제 스토어에 연결되지는 않습니다.', idLabel: '앱 ID', idPlaceholder: '예: aapbdbdomjkkjkaonfhkkikfgjllcleb', suggestions: ['Kahoot!', 'Padlet', 'Quizizz', '두클래스', 'Nearpod', 'Pear Deck', 'Google Keep', 'Adobe Express'] },
      url: { title: 'URL로 추가', hint: '입력한 주소가 웹앱으로 설치됩니다.', idLabel: 'URL', idPlaceholder: 'https://', suggestions: [] },
      id: { title: 'ID로 추가', hint: '확장 프로그램 ID 32자를 입력합니다.', idLabel: '확장 프로그램 ID', idPlaceholder: '예: nnckehldicaciogcbchegobnafnjkcne', suggestions: [] },
      play: {
        title: 'Android 앱 추가',
        hint: 'Managed Google Play에 등록된 Google 앱 중에서 선택합니다.',
        idLabel: '패키지 이름',
        idPlaceholder: '앱을 선택하면 자동으로 채워집니다',
        suggestions: [],
        select: ['Google 문서', 'Google 스프레드시트', 'Google 프레젠테이션', 'Google 설문지', 'Google Classroom', 'Google 드라이브', 'Gmail', 'Google 캘린더', 'Google Keep', 'Google Meet', 'YouTube'],
      },
    };
    const info = SOURCES[source] || SOURCES.webstore;
    root.innerHTML = modalShell(info.title, info.hint, `
      <form class="practice-form" data-form="app" data-source="${esc(source)}">
        <label><span>앱 이름 *</span>${info.select
          ? `<select name="name" required autofocus>${info.select.map((s) => `<option>${esc(s)}</option>`).join('')}</select>`
          : `<input name="name" required autofocus autocomplete="off" list="app-suggestions" placeholder="예: Kahoot!">`}</label>
        ${info.suggestions.length ? `<datalist id="app-suggestions">${info.suggestions.map((s) => `<option value="${esc(s)}"></option>`).join('')}</datalist>` : ''}
        <label><span>${esc(info.idLabel)}</span><input name="appId" autocomplete="off" placeholder="${esc(info.idPlaceholder)}"></label>
        <label><span>설치 정책</span>
          <select name="policy">
            <option>설치 허용</option>
            <option>강제 설치</option>
            <option>설치 및 고정</option>
            <option>차단</option>
          </select>
        </label>
        <label><span>적용 조직 단위</span>
          <select name="ou">${state.orgs.map((o) => `<option ${o.name === currentOu() ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select>
        </label>
        <div class="form-actions">
          <button type="button" data-close-modal>취소</button>
          <button type="submit">추가</button>
        </div>
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
  const target = event.target.closest('.lang-toggle,[data-signin],[data-mode],[data-nav],[data-toast],[data-set],[data-policy],[data-edit],[data-modal],[data-add],[data-close-modal],[data-backdrop],[data-close-toast],[data-policy-reset],[data-action]');
  if (!target) return;

  if (target.classList && target.classList.contains('lang-toggle')) {
    state.lang = state.lang === 'ko' ? 'en' : 'ko';
    try { localStorage.setItem('admin-sim:lang', state.lang); } catch { /* noop */ }
    render();
    return;
  }
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
  if (target.hasAttribute('data-add')) {
    event.preventDefault();
    openModal('record', { key: target.getAttribute('data-add') });
    return;
  }
  if (target.hasAttribute('data-modal')) {
    openModal(target.getAttribute('data-modal'), { parent: target.dataset.parent, source: target.dataset.source, legal: target.dataset.legal });
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
  if (action === 'reset-confirm') {
    policies = {};
    state.orgs = SEED.orgs.map((o) => ({ ...o }));
    state.users = SEED.users.map((u) => ({ ...u }));
    state.groups = SEED.groups.map((g) => ({ ...g }));
    state.apps = SEED.apps.map((a) => ({ ...a }));
    state.records = {};
    state.local = {};
    try { localStorage.removeItem(POLICY_KEY); } catch { /* noop */ }
    save();
    closeModal();
    navigate('home', '');
    toast('연습 데이터를 처음 상태로 되돌렸습니다.');
    return;
  }
  if (action === 'delete-record') {
    const key = target.dataset.key;
    const id = target.dataset.id;
    const row = (state.records[key] || []).find((r) => r.id === id);
    state.records[key] = (state.records[key] || []).filter((r) => r.id !== id);
    save();
    toast(row ? `‘${Object.values(row)[1] || '항목'}’을(를) 삭제했습니다.` : '항목을 삭제했습니다.');
    renderView();
    return;
  }
  if (action === 'delete-app') {
    const id = target.dataset.id;
    const app = state.apps.find((a) => a.id === id);
    state.apps = state.apps.filter((a) => a.id !== id);
    save();
    toast(app ? `‘${app.name}’을(를) 목록에서 삭제했습니다.` : '앱을 삭제했습니다.');
    renderView();
    return;
  }
  if (action === 'signout') {
    state.signedIn = false;
    save();
    closeModal();
    render();
    return;
  }
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
      email: `${username}@practice.senedu.kr`,
      org: String(data.get('org') || '연습학교'),
      status: '활성',
    });
    toast(`사용자 “${username}@practice.senedu.kr”을 만들었습니다.`);
  } else if (kind === 'group') {
    const address = String(data.get('address') || '').replace(/@.*/, '');
    const members = data.getAll('members').map(String);
    state.groups.push({
      id: uid(),
      name: String(data.get('name') || ''),
      email: `${address}@practice.senedu.kr`,
      description: String(data.get('description') || ''),
      members,
      memberCount: members.length,
    });
    toast(`그룹 “${address}@practice.senedu.kr”을 만들었습니다.`);
  } else if (kind === 'app') {
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const source = form.dataset.source;
    const typed = String(data.get('appId') || '').trim();
    const PLAY_PACKAGES = {
      'Google 문서': 'com.google.android.apps.docs.editors.docs',
      'Google 스프레드시트': 'com.google.android.apps.docs.editors.sheets',
      'Google 프레젠테이션': 'com.google.android.apps.docs.editors.slides',
      'Google 설문지': 'com.google.android.apps.forms',
      'Google Classroom': 'com.google.android.apps.classroom',
      'Google 드라이브': 'com.google.android.apps.docs',
      'Gmail': 'com.google.android.gm',
      'Google 캘린더': 'com.google.android.calendar',
      'Google Keep': 'com.google.android.keep',
      'Google Meet': 'com.google.android.apps.tachyon',
      'YouTube': 'com.google.android.youtube',
    };
    const fallbackId = source === 'play'
      ? (PLAY_PACKAGES[name] || 'com.google.android.app')
      : ({
        url: 'https://example.org',
        id: 'custom-extension-id',
        webstore: 'chrome-webstore-app',
      }[source] || 'chrome-webstore-app');
    state.apps = state.apps.concat({
      name,
      id: typed || `${fallbackId}-${state.apps.length + 1}`,
      policy: String(data.get('policy') || '설치 허용'),
      pinned: '고정되지 않음',
      ou: String(data.get('ou') || currentOu()),
      custom: true,
    });
    toast(`‘${name}’을(를) ${String(data.get('ou') || currentOu())} 조직 단위에 추가했습니다.`);
  } else if (kind === 'record') {
    const key = form.dataset.key;
    const schema = SCHEMAS[key] || { fields: [] };
    const row = { id: uid() };
    schema.fields.forEach((f) => {
      row[f.name] = f.type === 'checkbox'
        ? (data.get(f.name) ? '예' : '아니요')
        : String(data.get(f.name) || '').trim();
    });
    const label = row[schema.fields[0]?.name] || '항목';
    state.records[key] = (state.records[key] || []).concat(row);
    toast(`‘${label}’을(를) 추가했습니다.`);
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

function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('.lang-toggle').forEach((btn) => { btn.textContent = state.lang === 'ko' ? 'English' : '한국어'; });
  translateDom($('#signin'), state.lang);
  translateDom($('#app'), state.lang);
}

function render() {
  $('#signin').hidden = state.signedIn;
  $('#app').hidden = !state.signedIn;
  if (state.signedIn) {
    renderShell();
    renderNav();
    renderView();
  }
  applyLang();
}

/* ---------------- 초기화 ---------------- */
$('#menu-toggle').addEventListener('click', () => { state.sidebarOpen = !state.sidebarOpen; renderShell(); });
$('#rail-toggle').addEventListener('click', () => { state.railOpen = !state.railOpen; renderShell(); });
$('#profile-button').addEventListener('click', () => {
  if ($('#modal-root').querySelector('.account-popover')) { closeModal(); return; }
  openModal('account');
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
