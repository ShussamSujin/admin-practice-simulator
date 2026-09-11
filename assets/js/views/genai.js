// 담당 범위: 생성형 AI(Gemini) 섹션 — Gemini 앱 / Gemini Enterprise / Workspace의 Gemini / Gemini Notebook / Gemini 보고서(조직·사용자 수준 사용량)
// 원본: app/page.tsx 435-548 (GenerativeAiView, GeminiAppView, GeminiEnterpriseView, GeminiWorkspaceView, GeminiNotebookView, GeminiReportsView)

const WORKSPACE_FEATURES = [
  ['Calendar', '사용'],
  ['Drive 및 Docs', '사용'],
  ['Gmail', '사용'],
  ['Google Chat', '사용'],
  ['Google Meet', '사용'],
  ['Workspace Studio', '사용'],
];

const WORKSPACE_INTELLIGENCE = [
  ['Calendar', '사용'],
  ['Drive 및 Docs', '사용'],
  ['Gmail', '사용'],
  ['Google Chat', '사용'],
];

const ORG_ROWS = [
  ['전체 프롬프트', '12,480', '지난 28일', '+8%'],
  ['활성 사용자', '842', '지난 28일', '+3%'],
  ['Gemini 앱', '6,210', '지난 28일', '+5%'],
  ['Workspace의 Gemini', '4,980', '지난 28일', '+11%'],
  ['Gemini Enterprise', '1,290', '지난 28일', '+2%'],
];

const USER_ROWS = [
  ['김하늘', 'haneul@school.sen.ms.kr', '2.교원', '186'],
  ['이준서', 'junseo@school.sen.ms.kr', '3.학생', '142'],
  ['박서연', 'seoyeon@school.sen.ms.kr', '2.교원', '128'],
  ['최민재', 'minjae@school.sen.ms.kr', '3.학생', '97'],
  ['정도윤', 'doyoon@school.sen.ms.kr', '1.관리자', '64'],
];

function featureList(ctx, rows) {
  return `<div class="feature-list">${rows
    .map(([n, v]) => `<div><span>${ctx.esc(n)}</span><b class="status-on">${ctx.esc(v)}</b></div>`)
    .join('')}</div>`;
}

function geminiAppView(ctx) {
  return `<div class="section-page wide admin-page genai-page">
    ${ctx.crumb('생성형 AI > Gemini 앱')}
    <div class="genai-hero"><div class="gemini-logo"></div><div><h1>Gemini 앱</h1><p class="status-on">상태 모든 사용자에 사용</p></div></div>
    <div class="privacy-box"><strong>개인 정보 보호</strong><p>Gemini 앱의 채팅과 업로드된 파일은 사람 검토자에게 제공되지 않으며 생성형 AI 모델 개선에 사용되지 않습니다.</p></div>
    <article class="settings-card" data-toast="서비스 상태"><header><h2>서비스 상태</h2>${ctx.icon('expand_more', 18)}</header><div class="card-kv"><strong>상태</strong><span class="status-on">모든 사용자에 사용</span></div>${ctx.appliedOu()}</article>
    <article class="settings-card" data-toast="공유"><header><div><h2>공유</h2><p>공유 설정</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="settings-card-grid">
        <div><strong>대화 공유</strong><span>링크를 통해 대화를 공유하도록 허용</span></div>
        <div><strong>Gem 공유</strong><span>사용 설정됨: &#39;사용자가 Gemini 앱에서 Gem을 공유하도록 허용&#39;</span></div>
      </div>
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card" data-toast="데이터 보관"><header><div><h2>데이터 보관</h2><p>사용자의 Gemini 앱 활동 데이터를 보관하는 기간을 관리합니다.</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="settings-card-grid">
        <div><strong>Gemini 앱 활동</strong><span>사용 설정됨: 사용자가 Gemini 앱 활동을 저장하도록 허용</span></div>
        <div><strong>보관 기간</strong><span>18개월(기본값) 후 자동 삭제</span></div>
      </div>
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card" data-toast="연령 기반 액세스 설정"><header><div><h2>연령 기반 액세스 설정</h2><p>만 18세 미만 사용자의 Gemini 앱 액세스 방식을 관리합니다.</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="settings-card-grid">
        <div><strong>만 18세 미만 사용자</strong><span>사용 설정됨: 모든 연령의 사용자에게 Gemini 앱 사용 허용</span></div>
        <div><strong>청소년 보호 정책</strong><span>만 18세 미만 사용자에게는 연령에 적합한 환경과 추가 안전 필터가 적용됩니다.</span></div>
      </div>
      ${ctx.appliedOu()}
    </article>
  </div>`;
}

function geminiEnterpriseView(ctx) {
  return `<div class="section-page wide admin-page genai-page">
    ${ctx.crumb('생성형 AI > Gemini Enterprise')}
    <div class="genai-hero"><div class="gemini-logo"></div><div><h1>Gemini Enterprise</h1><p class="status-on">상태 모든 사용자에 사용</p></div></div>
    <div class="privacy-box">
      <p><strong>추가 서비스</strong> — Gemini Enterprise는 엔터프라이즈급 데이터 보호가 적용되는 추가 서비스입니다.</p>
      <p><strong>서비스 약관</strong> — 에디션별 데이터 액세스 약관을 확인하세요.</p>
      <p><strong>개인 정보 보호 보장</strong> — Gemini Enterprise 채팅과 업로드된 파일은 사람 검토자에게 제공되지 않으며 생성형 AI 모델 개선에 사용되지 않습니다.</p>
    </div>
    <article class="settings-card" data-toast="서비스 상태"><header><h2>서비스 상태</h2><span class="status-on">모든 사용자에 사용</span></header></article>
    <article class="settings-card" data-toast="Business"><header><div><h2>Business 에디션</h2><p>Gemini Enterprise - Business 에디션과 Google Workspace 간의 데이터 액세스 관리</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="card-kv"><strong>Workspace 데이터 액세스</strong><span>사용 설정됨: &#39;Gemini Enterprise&#39;가 Google Workspace 데이터에 액세스하도록 허용</span></div>
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card" data-toast="Standard"><header><div><h2>Standard, Plus, Frontline 버전</h2><p>Gemini Enterprise - Standard, Plus, Frontline 버전과 Google Workspace 간의 데이터 액세스 관리</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="card-kv"><strong>Workspace 데이터 액세스</strong><span>사용 설정됨: &#39;Gemini Enterprise&#39;가 Google Workspace 데이터에 액세스하도록 허용</span></div>
      ${ctx.appliedOu()}
    </article>
  </div>`;
}

function geminiWorkspaceView(ctx) {
  return `<div class="section-page wide admin-page genai-page">
    ${ctx.crumb('생성형 AI > Workspace의 Gemini')}
    <h1>Workspace의 Gemini 설정</h1>
    <p class="page-desc">Workspace의 Gemini와 관련된 설정을 관리합니다. <button class="link-btn" data-toast="자세히">자세히 알아보기</button></p>
    <div class="genai-hero compact"><div class="gemini-logo"></div><strong>Workspace의 Gemini</strong></div>
    <div class="privacy-box"><p>Gemini는 Workspace 데이터를 모델 학습에 사용하지 않습니다. <button class="link-btn" data-toast="개인정보">개인 정보 보호를 위한 노력 및 제어에 관해 알아보기</button></p></div>
    <article class="settings-card"><header><div><h2>기능 액세스</h2><p>Workspace 서비스 기능에 대한 액세스 관리</p></div>${ctx.icon('expand_more', 18)}</header>
      ${featureList(ctx, WORKSPACE_FEATURES)}
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card"><header><div><h2>Workspace Intelligence 소스</h2><p>Workspace Intelligence가 Gemini에 컨텍스트를 제공하여 더 나은 AI 환경을 만듭니다. <button class="link-btn" data-toast="자세히">자세히 알아보기</button></p></div>${ctx.icon('expand_more', 18)}</header>
      ${featureList(ctx, WORKSPACE_INTELLIGENCE)}
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card"><header><div><h2>클래스룸의 기능 액세스</h2><p>사용자가 클래스룸의 Gemini에 액세스할 수 있는지 선택합니다.</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="feature-list"><div><span>클래스룸</span><b class="status-on">사용</b></div></div>
      ${ctx.appliedOu()}
    </article>
  </div>`;
}

function geminiNotebookView(ctx) {
  return `<div class="section-page wide admin-page genai-page">
    ${ctx.crumb('생성형 AI > Gemini Notebook')}
    <div class="genai-hero"><div class="gemini-logo"></div><div><h1>Gemini Notebook</h1><p class="status-on">상태 모든 사용자에 사용</p></div></div>
    <div class="privacy-box"><p>NotebookLM / Gemini Notebook 자료는 조직 데이터 보호 정책에 따라 관리됩니다.</p></div>
    <article class="settings-card" data-toast="서비스 상태"><header><h2>서비스 상태</h2><span class="status-on">모든 사용자에 사용</span></header>${ctx.appliedOu()}</article>
    <article class="settings-card"><header><div><h2>노트북 공유</h2><p>사용자가 노트북을 조직 내부와 공유하는 방법을 관리합니다.</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="card-kv"><strong>내부 공유</strong><span>연습학교 사용자와 공유 허용</span></div>
      ${ctx.appliedOu()}
    </article>
    <article class="settings-card"><header><div><h2>데이터 보관</h2><p>노트북 소스와 생성 콘텐츠의 보관 기간</p></div>${ctx.icon('expand_more', 18)}</header>
      <div class="card-kv"><strong>보관</strong><span>Workspace 기본 보관 정책 따름</span></div>
    </article>
  </div>`;
}

function geminiReportsView(ctx, activeLink) {
  const isOrg = activeLink !== '사용자 수준 사용량';
  const body = isOrg
    ? `<div class="report-cards">${ORG_ROWS.slice(0, 3)
        .map(([t, v, p, d]) => `<article><small>${ctx.esc(p)}</small><h3>${ctx.esc(t)}</h3><strong>${ctx.esc(v)}</strong><span class="delta">${ctx.esc(d)}</span></article>`)
        .join('')}</div>
      <div class="data-panel flat"><table class="admin-table"><thead><tr><th>측정항목</th><th>값</th><th>기간</th><th>변화</th></tr></thead>
        <tbody>${ORG_ROWS.map((r) => `<tr><td><b>${ctx.esc(r[0])}</b></td><td>${ctx.esc(r[1])}</td><td>${ctx.esc(r[2])}</td><td>${ctx.esc(r[3])}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="data-panel flat"><div class="action-strip"><strong>사용자 수준 사용량 | 상위 사용자</strong><button data-toast="다운로드">다운로드</button></div>
        <table class="admin-table"><thead><tr><th>사용자</th><th>이메일</th><th>조직 단위</th><th>프롬프트 수</th></tr></thead>
          <tbody>${USER_ROWS.map((r) => `<tr><td><b class="blue-text">${ctx.esc(r[0])}</b></td><td>${ctx.esc(r[1])}</td><td>${ctx.esc(r[2])}</td><td>${ctx.esc(r[3])}</td></tr>`).join('')}</tbody></table></div>`;

  return `<div class="section-page wide admin-page genai-page">
    ${ctx.crumb('생성형 AI > Gemini 보고서')}
    <div class="page-title-row"><div><h1>Gemini 보고서</h1><p>조직과 사용자 수준의 Gemini 사용량을 확인합니다.</p></div>
      <div class="report-dropdown"><button class="outline-button" data-toast="기간">지난 28일 ${ctx.icon('expand_more', 14)}</button></div>
    </div>
    <div class="report-subnav">
      <button class="${isOrg ? 'active' : ''}" data-nav="ai::조직 수준 사용량">조직 수준 사용량</button>
      <button class="${!isOrg ? 'active' : ''}" data-nav="ai::사용자 수준 사용량">사용자 수준 사용량</button>
    </div>
    ${body}
  </div>`;
}

export default {
  'Gemini 앱': { render: (ctx) => geminiAppView(ctx) },
  'Gemini Enterprise': { render: (ctx) => geminiEnterpriseView(ctx) },
  'Workspace의 Gemini': { render: (ctx) => geminiWorkspaceView(ctx) },
  'Gemini Notebook': { render: (ctx) => geminiNotebookView(ctx) },
  'Gemini 보고서': { render: (ctx) => geminiReportsView(ctx, '조직 수준 사용량') },
  '조직 수준 사용량': { render: (ctx) => geminiReportsView(ctx, '조직 수준 사용량') },
  '사용자 수준 사용량': { render: (ctx) => geminiReportsView(ctx, '사용자 수준 사용량') },
};
