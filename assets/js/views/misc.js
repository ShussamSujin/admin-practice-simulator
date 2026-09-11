// 기기 / 보안 / 데이터 / 규칙 / 그 외 섹션
import { chromeDevicePolicyCategories } from '../data/chrome-device-policies.js';

const CHROMEOS_DEVICES = [
  ['5CD1234ABC', '프로비저닝됨', '5.크롬북(삭제금지)', 'student01@school.sen.ms.kr', '2026. 9. 10.'],
  ['5CD1234ABD', '프로비저닝됨', '5.크롬북(삭제금지)', 'student02@school.sen.ms.kr', '2026. 9. 10.'],
  ['5CD1234ABE', '사용 중지됨', '5.크롬북(삭제금지)', '—', '2026. 7. 2.'],
  ['5CD1234ABF', '프로비저닝됨', '4.태블릿기기', 'teacher01@school.sen.ms.kr', '2026. 9. 11.'],
];

function statCard(ctx, title, stats, nav) {
  return `<article class="chrome-widgets-card g-card" ${nav ? `data-nav="${nav}"` : ''} style="background:#fff;border:1px solid var(--g-divider)">
    <h3 style="margin:0 0 14px;font-size:16px;font-weight:500">${ctx.esc(title)}</h3>
    <div class="stat-row">${stats.map(([label, value]) => `<span>${ctx.esc(label)}<br><b>${ctx.esc(value)}</b></span>`).join('')}</div>
  </article>`;
}

function settingsCard(ctx, title, desc, fields = [], applied = true) {
  return `<article class="settings-card" data-toast="${ctx.esc(title)}">
    <header><div><h2>${ctx.esc(title)}</h2>${desc ? `<p>${ctx.esc(desc)}</p>` : ''}</div>${ctx.icon('expand_more', 18)}</header>
    ${fields.length ? `<div class="settings-card-grid">${fields.map(([k, v]) => `<div><strong>${ctx.esc(k)}</strong><span>${ctx.esc(v)}</span></div>`).join('')}</div>` : ''}
    ${applied ? ctx.appliedOu() : ''}
  </article>`;
}

const devices = {
  '개요': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > 개요')}
        <h1>기기</h1>
        <p class="page-desc">조직에서 사용하는 기기를 등록하고 정책을 적용합니다.</p>
        <div class="chrome-widgets">
          ${statCard(ctx, 'ChromeOS 기기', [['프로비저닝됨', '3'], ['사용 중지됨', '1'], ['등록 대기', '0']], 'devices::ChromeOS')}
          ${statCard(ctx, '모바일 기기', [['승인됨', '12'], ['대기 중', '2'], ['차단됨', '0']], 'devices::모바일 및 엔드포인트')}
        </div>
        <div class="settings-cards" style="margin-top:16px">
          ${settingsCard(ctx, '기기 등록', 'ChromeOS 기기를 조직에 등록하는 방법을 설정합니다.', [['등록 권한', '연습학교 사용자 허용'], ['등록 해제 권한', '관리자만 허용']])}
          ${settingsCard(ctx, '기기 보고', '기기 상태 및 사용량 보고 주기를 설정합니다.', [['기기 상태 보고', '사용 설정됨'], ['사용자 활동 보고', '사용 설정됨']])}
        </div>
      </div>`;
    },
  },
  '모바일 및 엔드포인트': {
    render(ctx) {
      return ctx.adminListPage({
        title: '모바일 및 엔드포인트',
        breadcrumb: '기기',
        description: '조직 데이터에 접근하는 모바일 기기와 엔드포인트를 관리합니다.',
        columns: ['기기', '유형', '소유자', '상태', '마지막 동기화'],
        rows: [
          ['iPad (교사용)', 'iPadOS 18', 'teacher01@school.sen.ms.kr', '승인됨', '2026. 9. 11.'],
          ['Galaxy Tab A9', 'Android 15', 'student01@school.sen.ms.kr', '승인됨', '2026. 9. 10.'],
          ['iPhone 16', 'iOS 19', 'admin@school.sen.ms.kr', '승인 대기', '2026. 9. 9.'],
        ],
        actionLabel: '기기 추가',
      });
    },
  },
  'ChromeOS': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > ChromeOS > 기기')}
        <div class="page-title-row">
          <div><h1>ChromeOS 기기</h1><p class="page-desc">등록된 크롬북을 조직 단위별로 관리합니다.</p></div>
          <button class="primary-button" data-toast="기기 등록">${ctx.icon('add', 18)} 기기 등록</button>
        </div>
        <div class="directory-layout">
          ${ctx.ouPicker(ctx.currentOu())}
          <section class="data-panel">
            <div class="action-strip">
              <strong>기기 | ${CHROMEOS_DEVICES.length}대 표시</strong>
              <button data-toast="다운로드">다운로드</button>
              <button data-toast="일괄 작업">일괄 작업</button>
            </div>
            <div class="filter-strip"><button data-toast="필터 추가">${ctx.icon('add', 17)} 필터 검색 또는 추가</button></div>
            <div class="table-wrap">
              <table class="admin-table">
                <thead><tr><th>일련번호</th><th>상태</th><th>조직 단위</th><th>최근 사용자</th><th>마지막 동기화</th></tr></thead>
                <tbody>${CHROMEOS_DEVICES.map((row) => `<tr>${row.map((cell, i) => `<td>${i === 0 ? `<b class="blue-text">${ctx.esc(cell)}</b>` : ctx.esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
              </table>
            </div>
            <div class="table-footer"><span>페이지당 행 수: 20</span><span>1-4 / 4</span></div>
          </section>
        </div>
      </div>`;
    },
  },
  'Chrome': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > Chrome > 설정 > 기기 설정')}
        <h1>기기 설정</h1>
        <p class="page-desc">선택한 조직 단위의 ChromeOS 기기에 적용되는 정책입니다. 항목을 클릭하면 값을 바꿔 볼 수 있습니다.</p>
        <div class="chrome-settings-layout">
          ${ctx.ouPicker(ctx.currentOu())}
          <div class="settings-main panel">
            <div class="settings-tools"><span>표시: 지원됨 · ${ctx.esc(ctx.currentOu())}에 적용</span><button data-toast="필터">${ctx.icon('add', 18)} 필터 검색 또는 추가</button><button data-toast="최근 변경사항">최근 변경사항</button></div>
            ${ctx.policyTable({ scope: 'chrome-device', categories: chromeDevicePolicyCategories })}
          </div>
        </div>
      </div>`;
    },
  },
  '네트워크': {
    render(ctx) {
      return ctx.adminListPage({
        title: '네트워크',
        breadcrumb: '기기',
        description: 'Wi-Fi, 이더넷, VPN 프로필을 기기에 배포합니다.',
        columns: ['이름', '유형', '적용 조직 단위', '보안'],
        rows: [['School-WiFi', 'Wi-Fi', '연습학교', 'WPA2-Enterprise'], ['Student-Guest', 'Wi-Fi', '3.학생', 'WPA2-PSK']],
        actionLabel: '네트워크 추가',
      });
    },
  },
};

const security = {
  '개요': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('보안 > 개요')}
        <h1>보안</h1>
        <p class="page-desc">조직의 인증, 데이터 접근, 알림 설정을 관리합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '2단계 인증', '사용자가 로그인할 때 추가 인증을 요구합니다.', [['적용', '사용 안함'], ['적용 대상', '연습학교 전체']])}
          ${settingsCard(ctx, '비밀번호 관리', '비밀번호 길이와 재사용 정책을 설정합니다.', [['최소 길이', '8자'], ['재사용 허용', '사용 안함']])}
          ${settingsCard(ctx, '로그인 문제', '의심스러운 로그인 시도를 확인합니다.', [['최근 7일', '0건'], ['차단된 시도', '0건']])}
        </div>
      </div>`;
    },
  },
  '인증': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('보안 > 인증')}
        <h1>인증</h1>
        <p class="page-desc">로그인 방식과 2단계 인증 정책을 설정합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '2단계 인증', '사용자가 2단계 인증을 사용하도록 설정합니다.', [['시행', '사용 안함'], ['보안 키 등록 기간', '설정 안함']])}
          ${settingsCard(ctx, '비밀번호 관리', '비밀번호 강도와 만료 정책입니다.', [['강도', '강함 권장'], ['만료', '만료되지 않음']])}
          ${settingsCard(ctx, '로그인 챌린지', '위치·기기가 평소와 다를 때 추가 확인을 요청합니다.', [['상태', '사용 설정됨']])}
          ${settingsCard(ctx, 'Google 계정으로 로그인', '서드 파티 앱에서 학교 계정으로 로그인하는 것을 허용합니다.', [['상태', '허용']])}
        </div>
      </div>`;
    },
  },
  '액세스 및 데이터 제어': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('보안 > 액세스 및 데이터 제어')}
        <h1>액세스 및 데이터 제어</h1>
        <p class="page-desc">외부 앱의 데이터 접근과 공유 범위를 제어합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, 'API 제어', '서드 파티 앱이 학교 데이터에 접근하는 것을 관리합니다.', [['신뢰할 수 있는 앱', '12개'], ['차단된 앱', '0개']])}
          ${settingsCard(ctx, '앱 액세스 제어', '만 18세 미만 사용자가 요청한 앱을 검토합니다.', [['검토 대기', '0건'], ['정책', '관리자 승인 필요']])}
          ${settingsCard(ctx, '덜 안전한 앱', '최신 보안 표준을 사용하지 않는 앱의 접근을 차단합니다.', [['상태', '차단됨']])}
          ${settingsCard(ctx, '데이터 보호', '민감한 정보가 외부로 공유되지 않도록 규칙을 적용합니다.', [['DLP 규칙', '0개']])}
        </div>
      </div>`;
    },
  },
  '보안 센터': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('보안 > 보안 센터')}
        <h1>보안 센터</h1>
        <p class="page-desc">보안 상태 점검과 조사 도구를 제공합니다. (최고 관리자 전용)</p>
        <div class="chrome-widgets">
          ${statCard(ctx, '보안 상태', [['권장 사항', '7'], ['적용됨', '3'], ['미적용', '4']])}
          ${statCard(ctx, '최근 알림', [['심각', '0'], ['보통', '1'], ['낮음', '3']])}
        </div>
      </div>`;
    },
  },
  '경고 센터': {
    render(ctx) {
      return ctx.adminListPage({
        title: '경고 센터',
        breadcrumb: '보안',
        description: '보안 및 규정 준수 관련 알림을 확인합니다. (최고 관리자 전용)',
        columns: ['알림', '심각도', '발생 시각', '상태'],
        rows: [
          ['의심스러운 로그인 시도', '보통', '2026. 9. 10. 21:14', '검토 필요'],
          ['기기 정책 미준수', '낮음', '2026. 9. 8. 10:02', '해결됨'],
        ],
        actionLabel: '알림 규칙 만들기',
      });
    },
  },
};

const data = {
  '데이터 이전': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('데이터 > 데이터 이전')}
        <h1>데이터 이전</h1>
        <p class="page-desc">이전 학교나 다른 계정에서 이메일, 캘린더, 연락처를 가져옵니다.</p>
        <div class="ext-dir-cards">
          <article class="ext-card" data-toast="이메일 이전">
            <div class="ext-illu sync"></div><h2>이메일</h2>
            <ul><li>Gmail, Microsoft Exchange, IMAP 서버에서 가져오기</li><li>사용자별 또는 일괄 이전 지원</li></ul>
          </article>
          <article class="ext-card" data-toast="캘린더 이전">
            <div class="ext-illu scim"></div><h2>캘린더 및 연락처</h2>
            <ul><li>일정과 연락처를 Google 계정으로 이전</li><li>이전 상태를 보고서로 확인</li></ul>
          </article>
        </div>
      </div>`;
    },
  },
  '가져오기 및 내보내기': {
    render(ctx) {
      return ctx.adminListPage({
        title: '가져오기 및 내보내기',
        breadcrumb: '데이터',
        description: '조직 데이터를 내보내거나 가져온 기록입니다.',
        columns: ['작업', '요청자', '요청일', '상태'],
        rows: [['사용자 목록 내보내기', 'admin@school.sen.ms.kr', '2026. 9. 1.', '완료'], ['그룹 일괄 가져오기', 'admin@school.sen.ms.kr', '2026. 8. 28.', '완료']],
        actionLabel: '새 내보내기',
      });
    },
  },
  '데이터 리전': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('데이터 > 데이터 리전')}
        <h1>데이터 리전</h1>
        <p class="page-desc">조직 데이터가 저장되는 지역을 지정합니다. (최고 관리자 전용)</p>
        <div class="settings-cards">${settingsCard(ctx, '데이터 리전', '저장 위치 정책', [['현재 설정', '지정 안함(전 세계)'], ['적용 대상', '연습학교']])}</div>
      </div>`;
    },
  },
};

const rules = {
  '*': {
    render(ctx) {
      const tab = ctx.local('rulesTab', '규칙');
      const tabs = ['규칙', '활동 규칙', '보고 규칙', '데이터 보호 규칙'];
      const rows = {
        '규칙': [['기기 미준수 알림', '기기', '사용 설정됨', '2026. 3. 2.'], ['외부 공유 알림', 'Drive', '사용 안함', '2026. 3. 2.']],
        '활동 규칙': [['관리자 권한 변경 알림', '관리자 활동', '사용 설정됨', '2026. 1. 12.']],
        '보고 규칙': [['주간 사용량 요약', '보고서', '사용 설정됨', '2026. 2. 1.']],
        '데이터 보호 규칙': [['주민등록번호 감지', 'Drive · Gmail', '사용 안함', '—']],
      };
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('규칙')}
        <div class="page-title-row">
          <div><h1>규칙</h1><p class="page-desc">알림과 자동 작업을 규칙으로 관리합니다.</p></div>
          <button class="primary-button" data-toast="규칙 만들기">${ctx.icon('add', 18)} 규칙 만들기</button>
        </div>
        <div class="apps-tabs">${tabs.map((t) => `<button class="${t === tab ? 'active' : ''}" data-set="rulesTab::${ctx.esc(t)}">${ctx.esc(t)}</button>`).join('')}</div>
        <div class="data-panel flat" style="margin-top:16px">
          <table class="admin-table">
            <thead><tr><th>이름</th><th>범위</th><th>상태</th><th>수정일</th></tr></thead>
            <tbody>${(rows[tab] || []).map((row) => `<tr>${row.map((cell, i) => `<td>${i === 0 ? `<b class="blue-text">${ctx.esc(cell)}</b>` : ctx.esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      </div>`;
    },
  },
};

const agents = {
  '*': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb(`에이전트 > ${ctx.state.link || '에이전트 개요'}`)}
        <h1>에이전트</h1>
        <p class="page-desc">Workspace에서 사용할 수 있는 자동화 에이전트를 관리합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '에이전트 사용', '조직에서 에이전트를 사용할 수 있는지 결정합니다.', [['상태', '모든 사용자에 사용'], ['적용 대상', '연습학교']])}
          ${settingsCard(ctx, '에이전트 활동 로그', '에이전트가 수행한 작업 기록을 확인합니다.', [['최근 7일', '0건']])}
        </div>
      </div>`;
    },
  },
};

const reports = {
  '*': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb(`보고 > ${ctx.state.link || '보고서'}`)}
        <h1>보고서</h1>
        <p class="page-desc">사용자 활동과 앱 사용량을 확인합니다.</p>
        <div class="report-cards">
          <article><small>활성 사용자</small><h3>지난 7일</h3><strong>1,372</strong><span class="delta">+2%</span></article>
          <article><small>파일 공유</small><h3>지난 7일</h3><strong>384</strong><span class="delta">+11%</span></article>
          <article><small>Meet 통화 시간</small><h3>지난 7일</h3><strong>92시간</strong><span class="delta">+4%</span></article>
        </div>
        <div class="data-panel flat">
          <table class="admin-table">
            <thead><tr><th>보고서</th><th>범위</th><th>기간</th><th>상태</th></tr></thead>
            <tbody>
              <tr><td><b class="blue-text">사용자 활동</b></td><td>연습학교</td><td>지난 30일</td><td>준비됨</td></tr>
              <tr><td><b class="blue-text">감사 및 조사</b></td><td>관리자 활동</td><td>지난 30일</td><td>준비됨</td></tr>
              <tr><td><b class="blue-text">앱 사용량</b></td><td>Workspace</td><td>지난 30일</td><td>준비됨</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    },
  },
};

const billing = {
  '*': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb(`결제 > ${ctx.state.link || '구독'}`)}
        <h1>구독</h1>
        <p class="page-desc">조직이 사용 중인 구독과 라이선스를 확인합니다.</p>
        <div class="data-panel flat">
          <table class="admin-table">
            <thead><tr><th>구독</th><th>라이선스</th><th>상태</th><th>갱신일</th></tr></thead>
            <tbody>
              <tr><td><b class="blue-text">Google Workspace for Education Fundamentals</b></td><td>무제한</td><td>사용 중</td><td>—</td></tr>
              <tr><td><b class="blue-text">Google Workspace for Education Standard</b></td><td>0 / 0</td><td>미사용</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    },
  },
};

const account = {
  '*': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb(`계정 > ${ctx.state.link || '계정 설정'}`)}
        <h1>계정 설정</h1>
        <p class="page-desc">조직 프로필, 관리자, 도메인 정보를 관리합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '프로필', '조직 이름, 언어, 시간대입니다.', [['조직 이름', '연습학교'], ['기본 언어', '한국어'], ['시간대', '(GMT+09:00) 서울'], ['기본 도메인', 'school.sen.ms.kr']])}
          ${settingsCard(ctx, '관리자 역할', '위임된 관리자와 권한을 확인합니다.', [['최고 관리자', '1명'], ['학교 관리자(센스쿨)', '1명']])}
          ${settingsCard(ctx, '법률 및 규정 준수', '학생 데이터 보호 및 동의 설정입니다.', [['만 18세 미만 지정', '사용 설정됨'], ['보호자 동의', '학교 관리']])}
        </div>
      </div>`;
    },
  },
};

const storage = {
  '*': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb(`저장용량 > ${ctx.state.link || '개요'}`)}
        <h1>저장용량</h1>
        <p class="page-desc">조직이 공유하는 저장용량 사용 현황입니다.</p>
        <div class="report-cards">
          <article><small>전체 사용량</small><h3>연습학교</h3><strong>3.2TB</strong><span class="delta">/ 100TB</span></article>
          <article><small>Drive</small><h3>파일</h3><strong>2.1TB</strong></article>
          <article><small>Gmail</small><h3>메일</h3><strong>0.8TB</strong></article>
        </div>
        <div class="data-panel flat">
          <table class="admin-table">
            <thead><tr><th>조직 단위</th><th>사용자</th><th>사용량</th><th>비율</th></tr></thead>
            <tbody>
              <tr><td><b class="blue-text">2.교원</b></td><td>68</td><td>1.4TB</td><td>44%</td></tr>
              <tr><td><b class="blue-text">3.학생</b></td><td>1,290</td><td>1.6TB</td><td>50%</td></tr>
              <tr><td><b class="blue-text">1.관리자</b></td><td>2</td><td>0.2TB</td><td>6%</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    },
  },
};

export default { devices, security, data, rules, agents, reports, billing, account, storage };
