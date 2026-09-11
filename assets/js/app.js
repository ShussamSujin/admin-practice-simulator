// 관리 콘솔 연습 시뮬레이터 — 셸(상단바/사이드바/라우팅/상태) 및 공용 부품
import { SECTIONS, visibleSections, visibleLinks, findSection, isRestricted } from './nav.js';
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
    { id: 'org-root', name: '연습학교', parent: '', description: '연습학교' },
    { id: 'org-admin', name: '1.관리자', parent: '연습학교', description: '-' },
    { id: 'org-teachers', name: '2.교원', parent: '연습학교', description: '-' },
    { id: 'org-students', name: '3.학생', parent: '연습학교', description: '-' },
    { id: 'org-tablets', name: '4.태블릿기기', parent: '연습학교', description: '-' },
    { id: 'org-chromebooks', name: '5.크롬북(삭제금지)', parent: '연습학교', description: '-' },
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
function ouPicker(selected) {
  const active = selected || currentOu();
  const root = state.orgs.find((o) => !o.parent) || { name: '연습학교' };
  const children = state.orgs.filter((o) => o.parent);
  return `<aside class="org-tree compact">
    <div class="ou-picker-tabs">
      <button data-toast="브라우저 탭">브라우저</button>
      <button data-toast="사용자 탭">사용자</button>
      <button data-toast="그룹 탭">그룹</button>
      <button class="active">조직 단위</button>
    </div>
    <label class="ou-search tight">${icon('search', 16)}<input placeholder="조직 단위 검색"></label>
    <button class="tree-root ${active === root.name ? 'selected' : ''}" data-set="selectedOu::${esc(root.name)}">${icon('expand_more', 16)} ${esc(root.name)}</button>
    ${children.map((o) => `<button class="tree-child ${active === o.name ? 'selected' : ''}" data-set="selectedOu::${esc(o.name)}">${esc(o.name)}</button>`).join('')}
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
function navigate(sectionId, link) {
  const section = findSection(sectionId) || findSection('home');
  state.section = section.id;
  const links = visibleLinks(section, state.mode);
  state.link = link !== undefined && link !== '' ? link : (links[0] || '');
  state.query = '';
  if ($('#search-input')) $('#search-input').value = '';
  state.expanded = { [section.id]: true };
  if (window.innerWidth < 860) state.sidebarOpen = false;
  window.scrollTo({ top: 0 });
  const hash = `#/${section.id}${state.link ? `/${encodeURIComponent(state.link)}` : ''}`;
  if (location.hash !== hash) { suppressHash = true; location.hash = hash; }
  render();
}
let suppressHash = false;
function readHash() {
  const parts = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/');
  if (!parts[0]) return;
  const section = findSection(parts[0]);
  if (!section) return;
  state.section = section.id;
  state.link = parts[1] || visibleLinks(section, state.mode)[0] || '';
  state.expanded = { [section.id]: true };
}

/* ---------------- 렌더: 사이드바 ---------------- */
function renderNav() {
  const sections = visibleSections(state.mode);
  $('#nav-list').innerHTML = sections.map((section) => {
    const links = visibleLinks(section, state.mode);
    const isActive = state.section === section.id;
    const open = links.length > 0 && (state.expanded[section.id] || isActive);
    const chevron = links.length === 0
      ? ''
      : `<span class="nav-chevron">${icon(open ? 'expand_more' : 'chevron_right', 18)}</span>`;
    return `<div class="nav-group">
      <button class="nav-item ${isActive ? (links.length ? 'active-parent' : 'active') : ''} ${links.length ? '' : 'no-chevron'}"
              data-nav="${section.id}::">
        ${chevron}${icon(section.icon, 22)}<span class="nav-label">${esc(section.title)}</span>
        ${section.blueDot ? '<i class="blue-dot"></i>' : ''}
        ${section.badge ? `<em>${esc(section.badge)}</em>` : ''}
      </button>
      ${open ? `<div class="subitems">${links.map((link) => `
        <button class="${isActive && state.link === link ? 'active' : ''}" data-nav="${section.id}::${esc(link)}">${esc(link)}</button>`).join('')}</div>` : ''}
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
    const registry = VIEW_MAP[section.id];
    view = registry && registry[state.link];
    if (!view && miscViews[section.id]) {
      const sectionViews = miscViews[section.id];
      view = sectionViews[state.link] || sectionViews['*'];
    }
    if (view) {
      html = view.render(ctx);
    } else {
      html = adminListPage({
        title: state.link || section.title,
        breadcrumb: section.title,
        description: section.subtitle,
        columns: ['이름', '상태', '적용', '비고'],
        rows: (section.links.length ? section.links : [section.title]).map((l, i) => [l, i % 2 ? '사용 중' : '준비됨', '연습학교', '예시']),
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
    `${s.title} ${s.subtitle || ''} ${visibleLinks(s, state.mode).join(' ')}`.toLowerCase().includes(q)
  ));
  const hiddenHits = state.mode === 'sen'
    ? SECTIONS.filter((s) => !s.sen && `${s.title} ${s.subtitle || ''} ${s.links.join(' ')}`.toLowerCase().includes(q))
    : [];
  return `<div class="search-results">
    <p class="eyebrow">통합 검색</p>
    <h1>검색 결과</h1>
    <p>${sections.length}개의 메뉴를 찾았습니다.</p>
    <div>${sections.map((s) => `
      <button data-nav="${s.id}::${esc(visibleLinks(s, state.mode)[0] || '')}">
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
        <label><span>상위 조직 단위</span><select name="parent">${state.orgs.map((o) => `<option ${o.name === '연습학교' ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
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
    root.innerHTML = modalShell(name, `${options.sectionLabel || '설정'} · 이 조직 단위에 적용`, `
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
  const target = event.target.closest('[data-signin],[data-mode],[data-nav],[data-toast],[data-set],[data-policy],[data-modal],[data-close-modal],[data-backdrop],[data-close-toast],[data-policy-reset],[data-action]');
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
    if (section && state.section === sectionId && !link && section.links.length) {
      state.expanded[sectionId] = !state.expanded[sectionId];
      renderNav();
      return;
    }
    navigate(sectionId, link);
    return;
  }
  if (target.hasAttribute('data-modal')) { openModal(target.getAttribute('data-modal')); return; }
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
    if (SEED.orgs.some((o) => o.id === id)) { toast('기본 조직 단위는 삭제할 수 없습니다.'); return; }
    state.orgs = state.orgs.filter((o) => o.id !== id);
    save(); toast('조직 단위를 삭제했습니다.'); renderView();
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
  const [user, device, apps] = await Promise.all([
    import('./data/chrome-user-policies.js'),
    import('./data/chrome-device-policies.js'),
    import('./data/chrome-apps-extension-settings.js'),
  ]);
  policyCatalogs = {
    'chrome-user': user.chromePoliciesByTab['사용자 및 브라우저 설정'] || user.chromeUserPolicyCategories,
    'chrome-device': user.chromePoliciesByTab['기기 설정'] || device.chromeDevicePolicyCategories,
    'chrome-guest': user.chromePoliciesByTab['관리 게스트 세션 설정'] || [],
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
