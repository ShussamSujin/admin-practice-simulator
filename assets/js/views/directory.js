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
      const rows = [
        { name: '연습학교', members: 1372, desc: 'Default audience with all users in your organization (updated automatically)' },
        { name: '연습 교사그룹', members: 1, desc: '' },
      ];
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('디렉터리 > 공유 대상 그룹')}
        <div class="page-title-row">
          <div><h1>공유 대상 그룹 ${ctx.icon('help', 18)}</h1><p class="page-desc">모든 공유 대상 그룹 표시</p></div>
          <button class="primary-button" data-toast="대상 만들기">대상 만들기</button>
        </div>
        <div class="data-panel flat">
          <table class="admin-table">
            <thead><tr><th></th><th>이름</th><th>회원</th><th>설명</th><th></th></tr></thead>
            <tbody>${rows.map((r) => `<tr>
              <td><input type="checkbox"></td>
              <td><b class="blue-text">${ctx.esc(r.name)}</b></td>
              <td>${r.members}</td>
              <td>${ctx.esc(r.desc || '—')}</td>
              <td>${r.name === '연습 교사그룹' ? `<button class="link-btn" data-toast="작업">작업 ${ctx.icon('expand_more', 14)}</button>` : ''}</td>
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
                    <button class="row-action" data-modal="org" title="하위 조직 단위 만들기">${ctx.icon('add', 18)}</button>
                    <button class="row-action danger" data-action="delete-org" data-id="${ctx.esc(o.id)}" title="삭제">${ctx.icon('delete', 18)}</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p class="page-desc" style="margin-top:14px">조직 단위를 클릭하면 해당 단위에만 정책을 적용할 수 있습니다. 기본 조직 단위는 연습용으로 보호되어 삭제되지 않습니다.</p>
      </div>`;
    },
  },

  '건물 및 리소스': {
    render(ctx) {
      return ctx.adminListPage({
        title: '건물 및 리소스',
        breadcrumb: '디렉터리',
        description: '회의실, 건물, 캘린더 리소스를 관리합니다.',
        columns: ['이름', '유형', '층', '용량'],
        rows: [['본관', '건물', '—', '—'], ['과학실', '회의실', '2층', '30'], ['도서관', '회의실', '1층', '40']],
        actionLabel: '리소스 추가',
      });
    },
  },

  '건물 및 리소스/건물 관리': {
    render(ctx) {
      return ctx.adminListPage({
        title: '건물 관리',
        breadcrumb: '디렉터리 > 건물 및 리소스',
        description: '학교 건물과 층 정보를 등록합니다.',
        columns: ['건물 이름', '설명', '층', '주소'],
        rows: [['본관', '교무실·교실', '1~4층', '서울특별시'], ['별관', '특별실', '1~2층', '서울특별시']],
        actionLabel: '건물 추가',
      });
    },
  },
  '건물 및 리소스/리소스 관리': {
    render(ctx) {
      return ctx.adminListPage({
        title: '리소스 관리',
        breadcrumb: '디렉터리 > 건물 및 리소스',
        description: '캘린더에서 예약할 수 있는 회의실과 공용 기기입니다.',
        columns: ['리소스 이름', '유형', '건물 · 층', '수용 인원'],
        rows: [
          ['과학실', '회의실', '본관 · 2층', '30'],
          ['도서관', '회의실', '본관 · 1층', '40'],
          ['이동형 빔프로젝터', '기타 리소스', '별관 · 1층', '-'],
        ],
        actionLabel: '리소스 추가',
      });
    },
  },
  '건물 및 리소스/기능 관리': {
    render(ctx) {
      return ctx.adminListPage({
        title: '기능 관리',
        breadcrumb: '디렉터리 > 건물 및 리소스',
        description: '회의실이 갖춘 기능(화상회의 장비 등)을 정의합니다.',
        columns: ['기능 이름', '설명', '적용 리소스', '상태'],
        rows: [['전자칠판', '터치 디스플레이', '과학실, 도서관', '사용'], ['화상회의', 'Meet 하드웨어', '도서관', '사용']],
        actionLabel: '기능 추가',
      });
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
