// 디렉터리 섹션 — 사용자 / 그룹 / 공유 대상 그룹 / 조직 단위 / 건물 및 리소스 / 디렉터리 설정 / 외부 디렉터리
const DIRECTORY_SETTING_CARDS = [
  {
    title: '공유 설정',
    desc: '사용자가 조직 외부에서 연락처를 공유할 수 있는 방법을 결정합니다.',
    fields: [['연락처 공유', "사용 설정됨: '연락처 공유 사용 설정'"], ['외부 디렉터리 공유', '조직 데이터 및 인증된 사용자 기본 프로필 필드']],
  },
  { title: '프로필 수정', desc: '사용자가 자신의 프로필을 수정할 수 있는지를 결정합니다.', fields: [] },
  { title: '공개 상태 설정', desc: '조직 단위에 공개할 사용자를 결정합니다.', fields: [] },
  {
    title: 'Workspace 리소스 유형 공개 상태',
    desc: '디렉터리에 표시할 Workspace 리소스 유형을 선택하세요.',
    fields: [['공개 상태', "사용 설정됨: 'Google 그룹스', 사용 설정됨: '도메인 공유 연락처'"]],
    footer: true,
  },
];

/** name 조직이 ancestor 아래(또는 자기 자신)인지 */
function isUnder(orgs, name, ancestor) {
  let current = orgs.find((o) => o.name === name);
  while (current && current.parent) {
    if (current.parent === ancestor) return true;
    current = orgs.find((o) => o.name === current.parent);
  }
  return false;
}

function lastSignIn(index) {
  return ['2026. 9. 11.', '2026. 9. 10.', '2026. 9. 8.', '한 번도 로그인하지 않음'][index % 4];
}

export default {
  '사용자': {
    render(ctx) {
      const { state } = ctx;
      const ou = ctx.currentOu();
      const rows = state.users.filter((u) => ou === '연습학교' || u.org === ou);
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 사용자')}
        <div class="page-title-row">
          <div><h1>사용자</h1><p class="page-desc">연습학교의 사용자 계정을 관리합니다.</p></div>
          <button class="primary-button" data-modal="user">${ctx.icon('add', 18)} 새 사용자 추가</button>
        </div>
        <div class="directory-layout">
          ${ctx.ouPicker(ou)}
          <section class="data-panel">
            <div class="action-strip">
              <strong>사용자 | ${ou === '연습학교' ? '모든 사용자 표시' : `${ctx.esc(ou)} 표시`}</strong>
              <button data-modal="user">새 사용자 추가</button>
              <button data-toast="일괄 업데이트">일괄 업데이트</button>
              <button data-toast="다운로드">다운로드</button>
              <button data-toast="더보기">더보기</button>
            </div>
            <div class="filter-strip"><button data-toast="필터 추가">${ctx.icon('add', 17)} 필터 추가</button></div>
            <div class="table-wrap detailed">
              <table>
                <thead><tr><th></th><th>이름 ${ctx.icon('arrow_upward', 14)}</th><th>이메일</th><th>상태</th><th>조직 단위</th><th>마지막 로그인</th><th></th></tr></thead>
                <tbody>${rows.map((u, i) => `<tr>
                  <td><input type="checkbox"></td>
                  <td><span class="avatar-dot">${ctx.esc(u.lastName.slice(0, 1))}</span><b class="blue-text">${ctx.esc(u.lastName)}${ctx.esc(u.firstName)}</b></td>
                  <td>${ctx.esc(u.email)}</td>
                  <td>${ctx.editable({ scope: 'users', name: `${u.email} · 상태`, value: u.status, section: '사용자',
                    options: ['활성', '정지됨', '보관처리됨', '비밀번호 재설정 필요'] })}</td>
                  <td>${ctx.editable({ scope: 'users', name: `${u.email} · 조직 단위`, value: u.org, section: '사용자',
                    options: ctx.orgRows().map((o) => o.name) })}</td>
                  <td>${lastSignIn(i)}</td>
                  <td class="col-actions"><button class="row-action" data-toast="사용자 정보 수정" title="수정">${ctx.icon('edit', 18)}</button><button class="row-action danger" data-action="delete-user" data-id="${ctx.esc(u.id)}" title="삭제">${ctx.icon('delete', 18)}</button></td>
                </tr>`).join('')}</tbody>
              </table>
            </div>
            <div class="table-footer"><span>페이지당 행 수: 20</span><span>1-${rows.length} / ${rows.length}</span></div>
          </section>
        </div>
      </div>`;
    },
  },

  '그룹': {
    render(ctx) {
      const { state } = ctx;
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 그룹')}
        <div class="page-title-row">
          <div><h1>그룹</h1><p class="page-desc">메일링 리스트와 협업 그룹을 관리합니다.</p></div>
          <button class="primary-button" data-modal="group">${ctx.icon('add', 18)} 그룹 만들기</button>
        </div>
        <div class="data-panel flat">
          <div class="action-strip">
            <strong>그룹 | ${state.groups.length}개 표시</strong>
            <button data-modal="group">그룹 만들기</button>
            <button data-toast="다운로드">다운로드</button>
          </div>
          <div class="filter-strip"><button data-toast="필터 추가">${ctx.icon('add', 17)} 필터 추가</button></div>
          <table class="admin-table">
            <thead><tr><th>이름</th><th>이메일</th><th>구성원</th><th>설명</th><th></th></tr></thead>
            <tbody>${state.groups.map((g) => `<tr>
              <td><b class="blue-text">${ctx.esc(g.name)}</b></td>
              <td>${ctx.esc(g.email)}</td>
              <td>${g.memberCount ?? (g.members ? g.members.length : 0)}</td>
              <td>${ctx.esc(g.description || '—')}</td>
              <td class="col-actions"><button class="row-action" data-toast="그룹 설정" title="설정">${ctx.icon('settings', 18)}</button><button class="row-action danger" data-action="delete-group" data-id="${ctx.esc(g.id)}" title="삭제">${ctx.icon('delete', 18)}</button></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    },
  },

  '공유 대상 그룹': {
    render(ctx) {
      // 전체 사용자 자동 그룹(all@)은 실제 사용자 수를 그대로 보여준다.
      const rows = [
        { name: '연습학교', email: 'all@school.sen.ms.kr', members: ctx.state.users.length, desc: 'Default audience with all users in your organization (updated automatically)' },
        ...ctx.state.groups.map((g) => ({ name: g.name, email: g.email, members: (g.members || []).length, desc: g.description || '' })),
      ];
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 공유 대상 그룹')}
        <div class="page-title-row">
          <div><h1>공유 대상 그룹 ${ctx.icon('help', 18)}</h1><p class="page-desc">모든 공유 대상 그룹 표시</p></div>
          <button class="primary-button" data-modal="group">대상 만들기</button>
        </div>
        <div class="data-panel flat">
          <table class="admin-table">
            <thead><tr><th></th><th>이름</th><th>이메일</th><th>구성원</th><th>설명</th></tr></thead>
            <tbody>${rows.map((r) => `<tr>
              <td><input type="checkbox"></td>
              <td><b class="blue-text">${ctx.esc(r.name)}</b></td>
              <td>${ctx.esc(r.email)}</td>
              <td>${r.members}</td>
              <td>${ctx.esc(r.desc || '—')}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    },
  },

  '조직 단위': {
    render(ctx) {
      const { state } = ctx;
      const collapsed = ctx.local('ouCollapsed', '').split('|').filter(Boolean);
      const hidden = (row) => row.depth > 0 && collapsed.some((name) => isUnder(state.orgs, row.name, name));
      const rows = ctx.orgRows().filter((row) => !hidden(row));
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 조직 단위')}
        <div class="ou-toolbar">
          <strong>조직 단위 관리 | 조직 단위 ${state.orgs.length}개 표시</strong>
          <button class="link-btn" data-modal="org">${ctx.icon('add', 16)} 조직 단위 만들기</button>
        </div>
        <label class="ou-search">${ctx.icon('search', 18)}<input placeholder="조직 단위 검색"></label>
        <div class="ou-table-wrap">
          <table class="admin-table ou-table">
            <thead><tr><th>이름</th><th>설명</th><th class="col-actions"></th></tr></thead>
            <tbody>
              ${rows.map((o) => {
                const open = !collapsed.includes(o.name);
                const toggle = collapsed.includes(o.name)
                  ? collapsed.filter((n) => n !== o.name)
                  : collapsed.concat(o.name);
                return `<tr class="${o.depth === 0 ? 'ou-root' : ''}">
                  <td>
                    <span class="ou-indent" style="padding-left:${o.depth * 24}px"></span>
                    ${o.hasChildren
                      ? `<button class="ou-toggle" data-set="ouCollapsed::${ctx.esc(toggle.join('|'))}" aria-label="${open ? '접기' : '펼치기'}">${ctx.icon(open ? 'arrow_drop_down' : 'arrow_right', 18)}</button>`
                      : '<span class="ou-toggle empty"></span>'}
                    <span class="ou-name ${o.depth === 0 ? 'root' : ''}">${ctx.esc(o.name)}</span>
                  </td>
                  <td class="ou-desc">${ctx.esc(o.description || '-')}</td>
                  <td class="col-actions">
                    <button class="row-action" data-modal="org" data-parent="${ctx.esc(o.name)}" title="'${ctx.esc(o.name)}' 아래에 조직 단위 만들기">${ctx.icon('add', 18)}</button>
                    ${o.depth === 0 ? '' : `<button class="row-action danger" data-action="delete-org" data-id="${ctx.esc(o.id)}" title="삭제">${ctx.icon('delete', 18)}</button>`}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p class="page-desc" style="margin-top:14px">행에 마우스를 올리면 <b>+</b>(하위 조직 단위 만들기)와 <b>삭제</b> 버튼이 나타납니다. 하위 조직이 있는 조직 단위를 삭제하면 하위까지 함께 삭제됩니다. 최상위 조직 단위는 실제 콘솔과 마찬가지로 삭제할 수 없습니다.</p>
      </div>`;
    },
  },

  '건물 및 리소스': {
    render(ctx) {
      ctx.defineList('buildings', {
        title: '건물', addLabel: '건물 추가',
        fields: [
          { name: 'name', label: '건물 이름', required: true, placeholder: '예: 본관' },
          { name: 'floors', label: '층', placeholder: '예: 1층, 2층, 3층' },
          { name: 'address', label: '주소', placeholder: '예: 서울특별시' },
          { name: 'description', label: '설명', type: 'textarea' },
        ],
      });
      const buildings = ctx.collection('buildings');
      const resources = ctx.collection('resources');
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 건물 및 리소스 > 개요')}
        <h1>건물 및 리소스</h1>
        <p class="page-desc">회의실·공용 기기를 등록하면 선생님들이 캘린더에서 예약할 수 있습니다.</p>
        <div class="chrome-widgets">
          <article class="g-card" style="background:#fff;border:1px solid var(--g-divider)">
            <h3 style="margin:0 0 14px;font-size:16px;font-weight:500">건물</h3>
            <div class="stat-row"><span>등록된 건물<br><b>${buildings.length}</b></span></div>
            <div style="margin-top:14px"><button class="outline-button" data-add="buildings">${ctx.icon('add', 18)} 건물 추가</button></div>
          </article>
          <article class="g-card" style="background:#fff;border:1px solid var(--g-divider)">
            <h3 style="margin:0 0 14px;font-size:16px;font-weight:500">리소스</h3>
            <div class="stat-row"><span>회의실·기기<br><b>${resources.length}</b></span></div>
            <div style="margin-top:14px"><button class="outline-button" data-nav="directory::건물 및 리소스/리소스 관리">${ctx.icon('chevron_right', 18)} 리소스 관리로 이동</button></div>
          </article>
        </div>
      </div>`;
    },
  },

  get '건물 및 리소스/개요'() { return this['건물 및 리소스']; },

  '건물 및 리소스/리소스 관리': {
    render(ctx) {
      ctx.defineList('buildings', {
        title: '건물', addLabel: '건물 추가',
        fields: [
          { name: 'name', label: '건물 이름', required: true, placeholder: '예: 본관' },
          { name: 'floors', label: '층', placeholder: '예: 1층, 2층, 3층' },
          { name: 'address', label: '주소', placeholder: '예: 서울특별시' },
          { name: 'description', label: '설명', type: 'textarea' },
        ],
      });
      const buildings = ctx.collection('buildings');
      const resources = ctx.collection('resources');
      const page = ctx.listPage({
        key: 'resources',
        title: '리소스',
        breadcrumb: '건물 및 리소스',
        description: '',
        addLabel: '리소스 추가',
        emptyTitle: '리소스가 없습니다',
        emptyHint: '회의실이나 공용 기기를 추가하면 캘린더에서 예약할 수 있습니다.',
        columns: [
          { key: 'name', label: '리소스' },
          { key: 'building', label: '건물' },
          { key: 'floor', label: '층' },
          { key: 'category', label: '카테고리', editable: true, options: ['회의실', '기타 리소스'] },
          { key: 'type', label: '유형' },
          { key: 'capacity', label: '수용 인원' },
        ],
        fields: [
          { name: 'category', label: '카테고리', type: 'select', options: ['(설정된 카테고리 없음)', '회의실', '기타 리소스'], required: true },
          { name: 'type', label: '유형', placeholder: '예: 전화 부스, 어머니 방, 자전거 등' },
          { name: 'building', label: '건물', type: 'select', options: () => ['정의된 건물 없음'].concat(ctx.collection('buildings').map((b) => b.name)) },
          { name: 'floor', label: '층', placeholder: '예: 2층' },
          { name: 'name', label: '리소스 이름', required: true, placeholder: '예: 과학실' },
          { name: 'capacity', label: '수용 인원', placeholder: '예: 30' },
          { name: 'features', label: '기능', placeholder: '예: 전자칠판, 화상회의' },
          { name: 'description', label: '사용자가 볼 수 있는 설명', type: 'textarea' },
          { name: 'excluded', label: '회의실 설정', type: 'checkbox', checkboxLabel: '회의실 예약 해제에서 제외' },
        ],
      });
      const buildingPane = `<aside class="building-pane">
        <h2>건물</h2>
        ${buildings.length
          ? `<div class="building-list">${buildings.map((b) => `<button data-toast="${ctx.esc(b.name)}"><span>${ctx.esc(b.name)}</span><small>${ctx.esc(b.floors || '—')}</small></button>`).join('')}
             </div><button class="link-btn" data-add="buildings" style="margin-top:10px">${ctx.icon('add', 16)} 건물 추가</button>`
          : `<p class="building-empty">빌딩을 찾을 수 없습니다.<br><button class="link-btn" data-add="buildings">건물 추가</button></p>`}
      </aside>`;
      // 리소스 목록 왼쪽에 건물 패널을 붙인다
      return page.replace('<div class="data-panel flat list-panel">', `<div class="resource-layout">${buildingPane}<div class="data-panel flat list-panel">`)
        .replace(/<\/div>\s*$/, '</div></div>');
    },
  },

  '건물 및 리소스/회의실 통계': {
    render(ctx) {
      const resources = ctx.collection('resources');
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('건물 및 리소스 > 회의실 통계 대시보드')}
        <div class="page-title-row">
          <div><h1>회의실 통계</h1><p class="page-desc">회의실 예약 방법 및 회의실 사용 방식이 표시됩니다.</p></div>
          <button class="outline-button" data-toast="기간 선택">2026. 9. 5. - 2026. 9. 11.</button>
        </div>
        <div class="practice-strip">${ctx.icon('info', 20)}<span>Google Meet 하드웨어를 사용하면 더 정확한 점유율 데이터를 얻을 수 있습니다.</span><button data-toast="자세히 알아보기">자세히 알아보기</button></div>
        <div class="report-cards">
          <article><small>예약 수</small><h3>지난 7일</h3><strong>0</strong></article>
          <article><small>등록된 회의실</small><h3>전체</h3><strong>${resources.length}</strong></article>
          <article><small>예약되지 않은 회의실 수용 인원</small><h3>전체</h3><strong>100%</strong></article>
        </div>
        ${resources.length ? '' : `<div class="list-empty" style="border:1px solid var(--g-divider);border-radius:12px">
          ${ctx.icon('inbox', 40)}
          <strong>표시할 예약 데이터가 없습니다</strong>
          <p>먼저 리소스를 등록하면 예약 통계가 여기에 표시됩니다.</p>
          <button class="primary-button" data-nav="directory::건물 및 리소스/리소스 관리">${ctx.icon('add', 18)} 리소스 관리로 이동</button>
        </div>`}
      </div>`;
    },
  },

  '건물 및 리소스/회의실 설정': {
    render(ctx) {
      const scope = 'rooms';
      const card = (title, desc, name, value, options) => `<article class="settings-card">
        <header><div><h2>${ctx.esc(title)}</h2><p>${ctx.esc(desc)}</p></div>${ctx.icon('expand_more', 18)}</header>
        <div class="card-kv"><strong>${ctx.esc(name)}</strong>${ctx.editable({ scope, name: `회의실 설정 · ${name}`, value, options, section: '전체 회의실 설정' })}</div>
      </article>`;
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('건물 및 리소스 > 전체 회의실 설정')}
        <h1>전체 회의실 설정</h1>
        <div class="dir-settings-layout">
          <div class="room-settings-hero"><div class="section-icon">${ctx.icon('apartment', 26)}</div><h2>건물 및 리소스</h2></div>
          <div class="settings-cards">
            ${card('거부된 일정의 회의실이 예약 해제됨', '회의실 예약 해제', '상태',
              '한 명을 제외한 모든 참석자가 일정을 거부한 경우 회의실이 예약 해제됩니다.',
              ['한 명을 제외한 모든 참석자가 일정을 거부한 경우 회의실이 예약 해제됩니다.', '예약 해제 사용 안함'])}
            ${card('회의실 예약 해제에서 회의실 제외', '예약 해제되지 않는 회의실입니다.', '제외된 회의실', '회의실 없음',
              ['회의실 없음', '일부 회의실 제외', '모든 회의실 제외'])}
            ${card('회의실 예약 해제에서 사용자 그룹 제외', '제외 사용자가 일정 주최자인 경우 회의실이 예약 해제되지 않습니다.', '제외된 그룹', '설정된 그룹 없음',
              ['설정된 그룹 없음', '교사 그룹 제외', '관리자 그룹 제외'])}
            ${card('자동 회의실 교체', '회의실에서 회의 초대를 거부하면 크기와 장비 수준이 유사한 동일 건물의 다른 회의실로 교체됩니다.', '자동 회의실 교체', '자동 회의실 교체 허용',
              ['자동 회의실 교체 허용', '자동 회의실 교체 사용 안함'])}
          </div>
        </div>
      </div>`;
    },
  },

  '디렉터리 설정': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 디렉터리 설정')}
        <div class="dir-settings-layout">
          <div class="dir-settings-hero"><div class="section-icon">${ctx.icon('group', 26)}</div><h1>디렉터리 설정</h1></div>
          <div class="settings-cards">
            ${DIRECTORY_SETTING_CARDS.map((c) => `<article class="settings-card">
              <header><h2>${ctx.esc(c.title)}</h2>${ctx.icon('expand_more', 18)}</header>
              <p>${ctx.esc(c.desc)}</p>
              ${c.fields.length ? `<div class="settings-card-grid">${c.fields.map(([k, v]) => `<div>
                <strong>${ctx.esc(k)}</strong>
                ${ctx.editable({ scope: `directory:${ctx.currentOu()}`, name: `${c.title} · ${k}`, value: v, section: c.title,
                  options: [v, '사용 설정됨', '사용 안함', '조직 단위별로 설정'] })}
              </div>`).join('')}</div>` : ''}
              ${c.footer ? ctx.appliedOu() : ''}
            </article>`).join('')}
          </div>
        </div>
      </div>`;
    },
  },

  '외부 디렉터리': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 외부 디렉터리')}
        <h1>외부 디렉터리 관리</h1>
        <p class="page-desc">환경 전반에서 인력을 동기화하는 방법을 선택하세요. 디렉터리 동기화, 인바운드 SCIM 또는 둘 다를 사용하세요. <button class="link-btn" data-toast="자세히">자세히 알아보기</button></p>
        <div class="ext-dir-cards">
          <article class="ext-card" data-toast="디렉터리 동기화">
            <div class="ext-illu sync"></div>
            <h2>디렉터리 동기화 <em class="badge-beta">베타</em></h2>
            <ul>
              <li>Microsoft Graph API를 사용해 디렉터리를 동기화합니다.</li>
              <li>Google이 디렉터리의 데이터를 가져옵니다.</li>
              <li>Azure AD 및 온프레미스 AD와 호환됩니다.</li>
            </ul>
          </article>
          <article class="ext-card" data-toast="인바운드 SCIM">
            <div class="ext-illu scim"></div>
            <h2>인바운드 SCIM <em class="badge-new">새 옵션</em></h2>
            <ul>
              <li>환경 전반에서 실시간 업데이트됩니다.</li>
              <li>외부 디렉터리에서 Google로 데이터를 푸시합니다.</li>
              <li>SCIM 2.0 표준을 준수하는 모든 ID 공급업체(IdP)와 호환됩니다.</li>
            </ul>
          </article>
        </div>
      </div>`;
    },
  },
};
