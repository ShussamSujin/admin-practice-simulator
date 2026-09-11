// 관리 콘솔 홈 — 실제 콘솔 홈(카드 3열)을 재현
const UPDATES = [
  { title: 'The Gemini desktop app is now available for Windows', date: '9월 12일' },
  { title: 'Gemini in Google Sheets is now available on Android devices', date: '03:32 오전' },
  { title: 'Manage external sharing for Gemini Notebook in the Admin console', date: '03:27 오전' },
  { title: 'Doubled cell limits in Google Sheets now generally available', date: '03:21 오전' },
];

function card(ctx, { id, title, sub, seeAll, body = '', tall, nav }) {
  const navAttr = nav === false ? '' : `data-nav="${id}::"`;
  return `<article class="g-card ${tall ? 'tall' : ''} ${nav === false ? '' : 'clickable'}" ${navAttr}>
    <header>
      <div><h2>${ctx.esc(title)}</h2>${sub ? `<p class="sub">${ctx.esc(sub)}</p>` : ''}</div>
      ${seeAll ? `<button class="see-all" data-nav="${id}::">모두 보기</button>` : ''}
    </header>
    ${body}
  </article>`;
}

function linkList(items) {
  return `<div class="card-link-list">${items.map((item) => (
    `<button data-nav="${item.nav || ''}" ${item.modal ? `data-modal="${item.modal}"` : ''} ${item.toast ? `data-toast="${item.toast}"` : ''}>
      <span>${item.label}</span><span class="msi s18" aria-hidden="true">chevron_right</span>
    </button>`
  )).join('')}</div>`;
}

export default {
  render(ctx) {
    const { state } = ctx;
    const full = state.mode === 'full';
    const userCount = state.users.length;
    const orgCount = state.orgs.length;

    const usersCard = card(ctx, {
      id: 'directory', title: '사용자', sub: '사용자 추가 또는 관리', seeAll: true, tall: true, nav: false,
      body: `<div class="card-stat"><b>${userCount}</b><span>개 계정 · 조직 단위 ${orgCount}개</span></div>
        ${linkList([
          { label: '사용자 추가', modal: 'user' },
          { label: '사용자 삭제', nav: 'directory::사용자' },
          { label: '사용자 이름 또는 이메일 업데이트', nav: 'directory::사용자' },
          { label: '사용자 비밀번호 재설정', toast: '비밀번호 재설정' },
          { label: '그룹 만들기', modal: 'group' },
        ])}`,
    });

    const accessCard = card(ctx, {
      id: 'security', title: '앱 액세스 제어', sub: '만 18세 미만으로 지정된 사용자가 요청한 앱 검토', tall: true, nav: false,
      body: `<div class="card-error">
        <span>Data can't be fetched due to system error</span>
        <button data-toast="TRY AGAIN">TRY AGAIN</button>
      </div>`,
    });

    const discoverCard = card(ctx, {
      id: 'apps', title: '디스커버', sub: 'Google을 최대한 활용해 보세요', seeAll: true, tall: true, nav: false,
      body: `<div class="discover-art"></div>
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:500">Google Workspace 최대한 활용하기</h3>
        <p class="body-text">Google Workspace의 가장 유용한 기능을 자세히 알아보고 모든 것이 제대로 설정되어 있는지 확인하세요.</p>
        <button class="text-link" data-toast="Google Workspace 살펴보기">Google Workspace 살펴보기</button>`,
    });

    const updatesCard = card(ctx, {
      id: 'account', title: '제품 업데이트', sub: 'Workspace의 최신 소식', seeAll: true, tall: true, nav: false,
      body: `<div class="update-list">${UPDATES.map((u) => (
        `<button data-toast="${ctx.esc(u.title)}"><span>${ctx.esc(u.title)}</span><time>${ctx.esc(u.date)}</time></button>`
      )).join('')}</div>`,
    });

    const devicesCard = card(ctx, { id: 'devices', title: '기기', sub: '기기 관리 및 조직의 데이터 보호' });
    const rulesCard = card(ctx, { id: 'rules', title: '규칙', sub: '규칙 관리를 통해 알림 및 작업 설정' });
    const ouCard = card(ctx, { id: 'directory', title: '조직 단위', sub: '사용자를 정책 적용을 위한 단위로 구성', nav: false,
      body: `<div class="card-link-list"><button data-nav="directory::조직 단위"><span>조직 단위 보기 (${orgCount}개)</span><span class="msi s18">chevron_right</span></button>
      <button data-modal="org"><span>조직 단위 만들기</span><span class="msi s18">add</span></button></div>` });
    const supportCard = card(ctx, { id: 'account', title: '지원', sub: '도움말 어시스턴트와 연결', nav: false,
      body: `<div class="card-link-list"><button data-toast="지원 문의"><span>Google 지원팀에 문의</span><span class="msi s18">chevron_right</span></button></div>` });
    const securityCard = card(ctx, { id: 'security', title: '보안', sub: '보안 설정 구성, 알림 및 분석 보기' });
    const chromeCard = card(ctx, { id: 'chrome', title: 'Chrome 브라우저', sub: '정책 · 확장 프로그램 관리' });
    const aiCard = card(ctx, { id: 'ai', title: '생성형 AI', sub: 'Gemini 앱 및 보고서 설정' });
    const appsCard = card(ctx, { id: 'apps', title: '앱', sub: 'Workspace 및 웹 앱 서비스 설정' });

    const columns = full
      ? [
          [usersCard, updatesCard, securityCard, appsCard],
          [accessCard, devicesCard, rulesCard, chromeCard],
          [discoverCard, ouCard, supportCard, aiCard],
        ]
      : [
          [usersCard, updatesCard, securityCard],
          [accessCard, devicesCard, rulesCard],
          [discoverCard, ouCard, supportCard],
        ];

    return `<div class="home">
      <div class="home-head">
        <div>
          <h1>${full ? '관리 콘솔 홈' : '관리 콘솔 홈'}</h1>
          <p>연습학교 · school.sen.ms.kr — ${ctx.esc(full ? '최고 관리자' : '학교 관리자(센스쿨)')} 권한으로 보는 중</p>
        </div>
        <span class="ou-badge">${ctx.icon('school', 18)} 연습학교</span>
      </div>
      <div class="practice-strip">
        ${ctx.icon('info', 20)}
        <span><b>연습용 시뮬레이터입니다.</b> 눌러 보는 모든 설정은 이 브라우저에만 저장되고 실제 조직에는 반영되지 않습니다.
        ${full ? '' : '센스쿨 학교 관리자에게 위임되지 않은 메뉴는 표시되지 않습니다.'}</span>
        <button data-mode="${full ? 'sen' : 'full'}">${full ? '센스쿨 권한으로 보기' : '최고관리자 권한과 비교하기'}</button>
      </div>
      <div class="card-columns">
        ${columns.map((col) => `<div class="card-col">${col.join('')}</div>`).join('')}
      </div>
    </div>`;
  },
};
