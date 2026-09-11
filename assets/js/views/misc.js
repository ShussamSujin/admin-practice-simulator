// 기기 / 보안 / 데이터 / 규칙 / 그 외 섹션
import { chromeDevicePolicyCategories } from '../data/chrome-device-policies.js';
import chromeViews from './chrome.js';

/** Chrome 브라우저 섹션의 화면을 기기 > Chrome 아래에서 재사용 (breadcrumb만 교체) */
function reuse(view, crumbText) {
  return {
    render(ctx) {
      const html = view.render(ctx);
      return crumbText
        ? html.replace(/<div class="page-crumb">[\s\S]*?<\/div>/, `<div class="page-crumb">${ctx.esc(crumbText)}</div>`)
        : html;
    },
    mount: view.mount,
  };
}

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

function settingsCard(ctx, title, desc, fields = [], applied = true, scope = 'settings') {
  return `<article class="settings-card">
    <header><div><h2>${ctx.esc(title)}</h2>${desc ? `<p>${ctx.esc(desc)}</p>` : ''}</div>${ctx.icon('expand_more', 18)}</header>
    ${fields.length ? `<div class="settings-card-grid">${fields.map(([k, v, options]) => `<div>
      <strong>${ctx.esc(k)}</strong>
      ${ctx.editable({ scope: `${scope}:${ctx.currentOu()}`, name: `${title} · ${k}`, value: v, options: options || defaultOptions(v), section: title })}
    </div>`).join('')}</div>` : ''}
    ${applied ? ctx.appliedOu() : ''}
  </article>`;
}

/** 값 형태를 보고 그럴듯한 선택지를 만든다 */
function defaultOptions(value) {
  const v = String(value || '');
  if (/^\d+$/.test(v)) return [v, '10', '30', '60', '무제한'];
  if (/사용 설정|사용함|사용$|허용|필수|사용 중/.test(v)) return [v, '사용 안함', '사용자가 결정하도록 허용', 'Google 기본값 사용'];
  if (/사용 안함|사용 중지|차단|허용 안함|미적용/.test(v)) return [v, '사용 설정됨', '사용자가 결정하도록 허용', 'Google 기본값 사용'];
  return [v, '사용 설정됨', '사용 안함', 'Google 기본값 사용'].filter((x, i, a) => x && a.indexOf(x) === i);
}

const chromeOsDeviceList = {
  render(ctx) {
    return `<div class="section-page wide admin-page">
      ${ctx.crumb('기기 > Chrome > 기기')}
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
};

const mobileOverview = {
  render(ctx) {
    return `<div class="section-page wide admin-page">
      ${ctx.crumb('기기 > 모바일 및 엔드포인트 > 개요')}
      <h1>모바일 및 엔드포인트</h1>
      <p class="page-desc">조직 데이터에 접근하는 휴대전화·태블릿·노트북을 관리합니다.</p>
      <div class="chrome-widgets">
        ${statCard(ctx, '기기 상태', [['승인됨', '12'], ['승인 대기', '2'], ['차단됨', '0']], 'devices::모바일 및 엔드포인트/기기')}
        ${statCard(ctx, '플랫폼', [['Android', '7'], ['iOS', '5'], ['기타', '2']])}
      </div>
      <div class="settings-cards" style="margin-top:16px">
        ${settingsCard(ctx, '모바일 관리', '기본 관리 / 고급 관리 중 적용 수준을 선택합니다.', [['적용 수준', '기본 관리'], ['적용 대상', '연습학교']])}
        ${settingsCard(ctx, '기기 승인', '새 기기가 조직 데이터에 접근하기 전 관리자 승인을 요구합니다.', [['상태', '사용 설정됨']])}
      </div>
    </div>`;
  },
};

const MOBILE_DEVICES = [
  ['iPad (교사용)', 'iPadOS 18', 'teacher01@school.sen.ms.kr', '승인됨', '2026. 9. 11.'],
  ['Galaxy Tab A9', 'Android 15', 'student01@school.sen.ms.kr', '승인됨', '2026. 9. 10.'],
  ['iPhone 16', 'iOS 19', 'admin@school.sen.ms.kr', '승인 대기', '2026. 9. 9.'],
];

const devices = {
  '개요': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > 개요')}
        <h1>기기</h1>
        <p class="page-desc">조직에서 사용하는 기기를 등록하고 정책을 적용합니다.</p>
        <div class="chrome-widgets">
          ${statCard(ctx, 'ChromeOS 기기', [['프로비저닝됨', '3'], ['사용 중지됨', '1'], ['등록 대기', '0']], 'devices::Chrome/기기')}
          ${statCard(ctx, '모바일 기기', [['승인됨', '12'], ['대기 중', '2'], ['차단됨', '0']], 'devices::모바일 및 엔드포인트/기기')}
        </div>
        <div class="settings-cards" style="margin-top:16px">
          ${settingsCard(ctx, '기기 등록', 'ChromeOS 기기를 조직에 등록하는 방법을 설정합니다.', [['등록 권한', '연습학교 사용자 허용'], ['등록 해제 권한', '관리자만 허용']])}
          ${settingsCard(ctx, '기기 보고', '기기 상태 및 사용량 보고 주기를 설정합니다.', [['기기 상태 보고', '사용 설정됨'], ['사용자 활동 보고', '사용 설정됨']])}
        </div>
      </div>`;
    },
  },

  /* 기기 > Chrome — 실제 콘솔과 동일한 하위 메뉴 구성 */
  'Chrome': reuse(chromeViews['개요'], '기기 > Chrome > 개요'),
  'Chrome/설정 가이드': reuse(chromeViews['설정 가이드'], '기기 > Chrome > 설정 가이드'),
  'Chrome/기기': chromeOsDeviceList,
  'Chrome/등록 토큰': reuse(chromeViews['토큰'], '기기 > Chrome > 등록 토큰'),
  'Chrome/관리 브라우저': reuse(chromeViews['관리 브라우저'], '기기 > Chrome > 관리 브라우저'),
  'Chrome/설정': reuse(chromeViews['설정'], '기기 > Chrome > 설정'),
  'Chrome/앱 및 확장 프로그램': reuse(chromeViews['앱 및 확장 프로그램'], '기기 > Chrome > 앱 및 확장 프로그램'),
  'Chrome/커넥터': reuse(chromeViews['커넥터'], '기기 > Chrome > 커넥터'),
  'Chrome/보고서': reuse(chromeViews['보고서'], '기기 > Chrome > 보고서'),
  'Chrome/웹 기능': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > Chrome > 웹 기능')}
        <h1>웹 기능</h1>
        <p class="page-desc">ChromeOS 기기에서 사용할 웹앱과 바로가기를 배포합니다.</p>
        <div class="data-panel flat">
          <div class="action-strip"><strong>웹 기능 | 3개 표시</strong><button data-toast="웹앱 추가">웹앱 추가</button></div>
          <table class="admin-table">
            <thead><tr><th>이름</th><th>URL</th><th>설치 정책</th><th>적용 조직 단위</th></tr></thead>
            <tbody>
              <tr><td><b class="blue-text">학교 홈페이지</b></td><td>https://school.sen.ms.kr</td><td>강제 설치</td><td>연습학교</td></tr>
              <tr><td><b class="blue-text">Google Classroom</b></td><td>https://classroom.google.com</td><td>강제 설치</td><td>3.학생</td></tr>
              <tr><td><b class="blue-text">Google 드라이브</b></td><td>https://drive.google.com</td><td>설치 허용</td><td>연습학교</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;
    },
  },
  'Chrome/프린터': {
    render(ctx) {
      return ctx.adminListPage({
        title: '프린터',
        breadcrumb: '기기 > Chrome',
        description: 'ChromeOS 기기에 배포할 프린터를 등록합니다.',
        columns: ['프린터 이름', '제조사 및 모델', '프로토콜', '적용 조직 단위'],
        rows: [
          ['교무실 복합기', 'Samsung SL-X4300', 'ipps', '2.교원'],
          ['도서관 프린터', 'HP LaserJet M404', 'ipp', '연습학교'],
        ],
        actionLabel: '프린터 추가',
      });
    },
  },
  'Chrome/보고서/기기 보고서': {
    render(ctx) {
      return ctx.adminListPage({
        title: '기기 보고서',
        breadcrumb: '기기 > Chrome > 보고서',
        description: '등록된 ChromeOS 기기의 상태와 사용 현황입니다.',
        columns: ['보고서', '기간', '기기 수', '상태'],
        rows: [['기기 상태', '지난 7일', '4', '준비됨'], ['자동 업데이트 만료(AUE)', '전체', '4', '준비됨']],
        actionLabel: '보고서 새로고침',
      });
    },
  },
  'Chrome/보고서/앱 및 확장 프로그램 사용량': {
    render(ctx) {
      return ctx.adminListPage({
        title: '앱 및 확장 프로그램 사용량',
        breadcrumb: '기기 > Chrome > 보고서',
        description: '기기에 설치된 앱·확장 프로그램 사용 현황입니다.',
        columns: ['앱 이름', '설치 수', '사용 기기', '권한 위험도'],
        rows: [['Kami', '4', '4', '낮음'], ['Padlet', '3', '2', '보통'], ['Canva', '4', '3', '낮음']],
        actionLabel: '보고서 다운로드',
      });
    },
  },
  'Chrome/보고서/버전 보고서': {
    render(ctx) {
      return ctx.adminListPage({
        title: '버전 보고서',
        breadcrumb: '기기 > Chrome > 보고서',
        description: '기기별 ChromeOS 버전 분포입니다.',
        columns: ['버전', '기기 수', '채널', '비고'],
        rows: [['ChromeOS 154', '3', '안정화', '최신'], ['ChromeOS 153', '1', '안정화', '업데이트 필요']],
        actionLabel: '보고서 새로고침',
      });
    },
  },

  /* 기기 > 모바일 및 엔드포인트 */
  '모바일 및 엔드포인트': mobileOverview,
  '모바일 및 엔드포인트/개요': mobileOverview,
  '모바일 및 엔드포인트/기기': {
    render(ctx) {
      return ctx.adminListPage({
        title: '기기',
        breadcrumb: '기기 > 모바일 및 엔드포인트',
        description: '조직 데이터에 접근하는 모바일 기기와 엔드포인트를 관리합니다.',
        columns: ['기기', '유형', '소유자', '상태', '마지막 동기화'],
        rows: MOBILE_DEVICES,
        actionLabel: '기기 추가',
      });
    },
  },
  '모바일 및 엔드포인트/설정': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > 모바일 및 엔드포인트 > 설정')}
        <h1>설정</h1>
        <p class="page-desc">모바일 기기에 적용할 보안 정책입니다.</p>
        <div class="directory-layout">
          ${ctx.ouPicker(ctx.currentOu())}
          <div class="settings-cards">
            ${settingsCard(ctx, '화면 잠금', '기기 잠금 방식과 비밀번호 요구사항입니다.', [['잠금 요구', '사용 설정됨'], ['최소 길이', '6자']])}
            ${settingsCard(ctx, '기기 암호화', '조직 데이터를 저장하는 기기의 암호화를 요구합니다.', [['상태', '필수']])}
            ${settingsCard(ctx, '원격 초기화', '분실 기기에서 학교 계정 데이터를 지웁니다.', [['관리자 원격 초기화', '허용']])}
          </div>
        </div>
      </div>`;
    },
  },
  '모바일 및 엔드포인트/앱': {
    render(ctx) {
      return ctx.adminListPage({
        title: '앱',
        breadcrumb: '기기 > 모바일 및 엔드포인트',
        description: '모바일 기기에 배포하는 앱 목록입니다.',
        columns: ['앱 이름', '플랫폼', '배포 방식', '적용 조직 단위'],
        rows: [
          ['Google Classroom', 'Android · iOS', '강제 설치', '3.학생'],
          ['Google Drive', 'Android · iOS', '설치 허용', '연습학교'],
        ],
        actionLabel: '앱 추가',
      });
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
            <tbody>${(rows[tab] || []).map((row) => `<tr>
              <td><b class="blue-text">${ctx.esc(row[0])}</b></td>
              <td>${ctx.esc(row[1])}</td>
              <td>${ctx.editable({ scope: 'rules', name: `${row[0]} · 상태`, value: row[2], section: '규칙',
                options: ['사용 설정됨', '사용 안함', '보고 전용'] })}</td>
              <td>${ctx.esc(row[3])}</td>
            </tr>`).join('')}</tbody>
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

/* ---- 보안 / 데이터 하위(3단계) 메뉴 화면 ---- */
function cardPage(ctx, { crumb, title, desc, cards, ou = false }) {
  const body = `<div class="settings-cards">${cards.map((c) => settingsCard(ctx, c[0], c[1], c[2] || [])).join('')}</div>`;
  return `<div class="section-page wide admin-page">
    ${ctx.crumb(crumb)}
    <h1>${ctx.esc(title)}</h1>
    ${desc ? `<p class="page-desc">${ctx.esc(desc)}</p>` : ''}
    ${ou ? `<div class="directory-layout">${ctx.ouPicker(ctx.currentOu())}${body}</div>` : body}
  </div>`;
}

Object.assign(security, {
  '인증/2단계 인증': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 2단계 인증', title: '2단계 인증', ou: true,
      desc: '로그인할 때 비밀번호 외에 추가 확인 단계를 요구합니다.',
      cards: [
        ['인증 시행', '조직 단위별로 2단계 인증 사용을 강제할 수 있습니다.', [['시행', '사용 안함'], ['유예 기간', '설정 안함']]],
        ['허용 인증 방법', '사용할 수 있는 두 번째 인증 수단입니다.', [['방법', '휴대전화 알림, 인증 앱, 보안 키'], ['백업 코드', '허용']]],
        ['새 기기 신뢰', '같은 기기에서 재인증을 건너뛸 수 있습니다.', [['상태', '사용 설정됨']]],
      ],
    }),
  },
  '인증/로그인 챌린지': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 로그인 챌린지', title: '로그인 챌린지',
      desc: '평소와 다른 위치·기기에서 로그인하면 추가 확인을 요청합니다.',
      cards: [
        ['직원 ID 확인', '로그인 챌린지에서 직원 ID를 묻습니다.', [['상태', '사용 안함']]],
        ['복구 정보 확인', '전화번호 또는 복구 이메일로 본인을 확인합니다.', [['상태', '사용 설정됨']]],
      ],
    }),
  },
  '인증/고급 보호 프로그램': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 고급 보호 프로그램', title: '고급 보호 프로그램',
      desc: '표적 공격 위험이 큰 계정에 가장 강력한 보호를 적용합니다.',
      cards: [['등록 허용', '사용자가 고급 보호 프로그램에 등록할 수 있게 합니다.', [['상태', '허용'], ['등록 사용자', '0명']]]],
    }),
  },
  '인증/비밀번호 관리': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 비밀번호 관리', title: '비밀번호 관리', ou: true,
      desc: '비밀번호 강도와 재사용 정책을 설정합니다.',
      cards: [
        ['비밀번호 강도', '약한 비밀번호 사용을 막습니다.', [['강도 적용', '사용 설정됨'], ['최소 길이', '8자'], ['최대 길이', '100자']]],
        ['재사용 및 만료', '이전 비밀번호 재사용과 만료 주기입니다.', [['재사용 허용', '사용 안함'], ['만료', '만료되지 않음']]],
      ],
    }),
  },
  '액세스 및 데이터 제어/API 제어': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 제어 > API 제어', title: 'API 제어',
      desc: '서드 파티 앱이 학교 계정 데이터에 접근하는 방식을 관리합니다.',
      cards: [
        ['앱 액세스 제어', '신뢰할 수 있는 앱 목록을 관리합니다.', [['신뢰할 수 있는 앱', '12개'], ['차단된 앱', '0개'], ['기본 정책', '관리자 승인 필요']]],
        ['도메인 소유 앱', '학교가 만든 내부 앱은 자동으로 신뢰합니다.', [['상태', '신뢰함']]],
      ],
    }),
  },
  '액세스 및 데이터 제어/덜 안전한 앱': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 제어 > 덜 안전한 앱', title: '덜 안전한 앱',
      desc: '최신 보안 표준(OAuth)을 사용하지 않는 앱의 접근을 제어합니다.',
      cards: [['액세스 허용 여부', '덜 안전한 앱의 로그인 허용 여부입니다.', [['상태', '모든 사용자에 대해 사용 중지'], ['적용 대상', '연습학교']]]],
    }),
  },
  '액세스 및 데이터 제어/컨텍스트 인식 액세스': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 제어 > 컨텍스트 인식 액세스', title: '컨텍스트 인식 액세스',
      desc: '기기 상태·위치·IP에 따라 접근을 허용하거나 차단합니다.',
      cards: [['액세스 수준', '정의된 접근 조건입니다.', [['만든 수준', '0개'], ['적용된 앱', '없음']]]],
    }),
  },
  '액세스 및 데이터 제어/데이터 보호': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 제어 > 데이터 보호', title: '데이터 보호',
      desc: '민감한 정보가 외부로 공유되지 않도록 규칙을 적용합니다.',
      cards: [
        ['DLP 규칙', 'Drive·Gmail·Chat에 적용할 데이터 손실 방지 규칙입니다.', [['활성 규칙', '0개'], ['보고 전용', '0개']]],
        ['민감 정보 유형', '주민등록번호, 전화번호 등 탐지 항목입니다.', [['기본 제공 감지기', '사용 가능']]],
      ],
    }),
  },
  '보안 센터/대시보드': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 보안 센터 > 대시보드', title: '보안 대시보드',
      desc: '조직의 보안 지표를 한눈에 확인합니다. (최고 관리자 전용)',
      cards: [
        ['스팸 및 피싱', '차단된 메일 현황입니다.', [['지난 7일 차단', '128건'], ['사용자 신고', '2건']]],
        ['파일 공유', '외부 공유 현황입니다.', [['외부 공유 문서', '17개'], ['링크 공개 문서', '3개']]],
      ],
    }),
  },
  '보안 센터/조사 도구': {
    render: (ctx) => ctx.adminListPage({
      title: '조사 도구', breadcrumb: '보안 > 보안 센터',
      description: '로그 이벤트를 검색해 보안 사고를 조사합니다. (최고 관리자 전용)',
      columns: ['저장된 검색', '데이터 소스', '만든 사람', '수정일'],
      rows: [['외부 공유 문서 조회', 'Drive 로그 이벤트', 'admin@school.sen.ms.kr', '2026. 8. 30.']],
      actionLabel: '새 조사',
    }),
  },
  '보안 센터/상태 점검': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 보안 센터 > 상태 점검', title: '보안 상태 점검',
      desc: 'Google 권장 설정과 현재 설정을 비교합니다. (최고 관리자 전용)',
      cards: [
        ['권장 사항', '적용하지 않은 권장 설정입니다.', [['전체', '7개'], ['적용됨', '3개'], ['미적용', '4개']]],
        ['우선 조치', '가장 먼저 확인할 항목입니다.', [['2단계 인증 시행', '미적용'], ['덜 안전한 앱 차단', '적용됨']]],
      ],
    }),
  },
});

Object.assign(data, {
  '데이터 가져오기 및 내보내기': {
    render: (ctx) => cardPage(ctx, {
      crumb: '데이터 > 데이터 가져오기 및 내보내기', title: '데이터 가져오기 및 내보내기',
      desc: '다른 계정에서 데이터를 가져오거나 조직 데이터를 내보냅니다.',
      cards: [
        ['데이터 이전', '이메일·캘린더·연락처를 학교 계정으로 옮깁니다.', [['최근 작업', '없음']]],
        ['데이터 내보내기', '조직 전체 데이터를 내보냅니다.', [['최근 내보내기', '2026. 9. 1.']]],
      ],
    }),
  },
  '데이터 가져오기 및 내보내기/데이터 이전': { render: (ctx) => data['데이터 이전'].render(ctx) },
  '데이터 가져오기 및 내보내기/데이터 내보내기': {
    render: (ctx) => ctx.adminListPage({
      title: '데이터 내보내기', breadcrumb: '데이터 > 데이터 가져오기 및 내보내기',
      description: '조직 데이터를 내보낸 기록입니다. 내보내기는 최고 관리자만 실행할 수 있습니다.',
      columns: ['작업', '요청자', '요청일', '상태'],
      rows: [['사용자 목록 내보내기', 'admin@school.sen.ms.kr', '2026. 9. 1.', '완료'], ['그룹 일괄 가져오기', 'admin@school.sen.ms.kr', '2026. 8. 28.', '완료']],
      actionLabel: '새 내보내기',
    }),
  },
  '규정 준수': {
    render: (ctx) => cardPage(ctx, {
      crumb: '데이터 > 규정 준수', title: '규정 준수',
      desc: '데이터 보관 위치와 규정 준수 설정입니다. (최고 관리자 전용)',
      cards: [['데이터 리전', '조직 데이터가 저장되는 지역입니다.', [['현재 설정', '지정 안함(전 세계)'], ['적용 대상', '연습학교']]]],
    }),
  },
  '규정 준수/데이터 리전': { render: (ctx) => data['데이터 리전'].render(ctx) },
});

export default { devices, security, data, rules, agents, reports, billing, account, storage };
