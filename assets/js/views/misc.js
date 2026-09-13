// 기기 / 보안 / 데이터 / 규칙 / 그 외 섹션
import { chromeDevicePolicyCategories } from '../data/chrome-device-policies.js';
import chromeViews from './chrome.js';
import mobileSettings from './mobile-settings.js';

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

const OU_FIELD_OPTIONS = ['연습학교', '1.관리자', '2.교원', '3.학생', '4.태블릿기기', '5.크롬북(삭제금지)'];

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
    return ctx.listPage({
      key: 'chromeos-devices',
      title: 'ChromeOS 기기',
      breadcrumb: '기기 > Chrome',
      description: '등록된 크롬북을 조직 단위별로 관리합니다.',
      addLabel: '기기 등록',
      ouPicker: true,
      emptyTitle: '아직 등록된 ChromeOS 기기가 없습니다',
      columns: [
        { key: 'serial', label: '일련번호' },
        { key: 'status', label: '상태', editable: true, options: ['프로비저닝됨', '사용 중지됨'] },
        { key: 'ou', label: '조직 단위' },
        { key: 'user', label: '최근 사용자' },
        { key: 'lastSync', label: '마지막 동기화' },
      ],
      fields: [
        { name: 'serial', label: '일련번호', required: true, placeholder: '예: 5CD1234ABC' },
        { name: 'ou', label: '조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
        { name: 'user', label: '최근 사용자', placeholder: '예: student01@practice.senedu.kr' },
      ],
    });
  },
};

/* ---- 기기 > 모바일 및 엔드포인트 ---- */
const MOBILE_OS_OPTIONS = ['Android 16', 'Android 15', 'iOS 26', 'iPadOS 18', 'Windows 11', 'ChromeOS'];
const MOBILE_OWNERSHIP = ['소유 사용자', '회사 소유'];

/** "사용 설정됨: '…'" ↔ "사용 중지됨: '…'" 반대 문구 페어를 만든다 */
function mobileToggleOptions(value) {
  const v = String(value || '');
  if (v.startsWith('사용 설정됨: ')) return [v, `사용 중지됨: ${v.slice('사용 설정됨: '.length)}`, '사용자가 결정하도록 허용'];
  if (v.startsWith('사용 중지됨: ')) return [v, `사용 설정됨: ${v.slice('사용 중지됨: '.length)}`, '사용자가 결정하도록 허용'];
  return [v, '사용자가 결정하도록 허용'];
}

/** 모바일 설정 화면 공통 레이아웃 — 왼쪽 히어로 카드 + 오른쪽 섹션 카드 */
function mobileSettingsPage(ctx, { crumb, title, prefix, desc, sections }) {
  return `<div class="section-page wide admin-page">
    ${ctx.crumb(crumb)}
    <div class="dir-settings-layout">
      <div class="dir-settings-hero">
        <div class="section-icon">${ctx.icon('devices', 26)}</div>
        <h1>${ctx.esc(title)}</h1>
        ${desc ? `<p class="page-desc">${ctx.esc(desc)}</p>` : ''}
      </div>
      <div class="settings-cards">
        ${sections.map(([name, sdesc, items]) => `<article class="settings-card">
          <header><div><h2>${ctx.esc(name)}</h2>${sdesc ? `<p>${ctx.esc(sdesc)}</p>` : ''}</div>${ctx.icon('expand_more', 18)}</header>
          <div class="settings-card-grid">${items.map(([k, v, options]) => `<div>
            <strong>${ctx.esc(k)}</strong>
            ${ctx.editable({ scope: `mobile:${ctx.currentOu()}`, name: `${prefix} · ${k}`, value: v, options: options || mobileToggleOptions(v), section: name })}
          </div>`).join('')}</div>
          ${ctx.appliedOu()}
        </article>`).join('')}
      </div>
    </div>
  </div>`;
}

const mobileDeviceList = {
  render(ctx) {
    return ctx.listPage({
      key: 'mobile-devices',
      title: '기기',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '할당된 조직 단위의 사용자 기기 표시',
      addLabel: '기기 추가',
      ouPicker: true,
      toolbar: `<div class="filter-strip">
        <button data-toast="상태 필터">상태: 모두 ${ctx.icon('arrow_drop_down', 16)}</button>
        <button data-toast="OS 필터">OS: 모두 ${ctx.icon('arrow_drop_down', 16)}</button>
      </div>`,
      emptyTitle: '표시할 기기가 없습니다',
      emptyHint: '‘기기 추가’를 눌러 연습용 기기를 등록해 보세요. 등록한 내용은 이 브라우저에만 저장됩니다.',
      columns: [
        { key: '기기 이름', label: '기기 이름' },
        { key: '이름', label: '이름' },
        { key: '이메일', label: '이메일' },
        { key: 'OS', label: 'OS' },
        { key: '소유권', label: '소유권', editable: true, options: MOBILE_OWNERSHIP },
        { key: '상태', label: '상태', editable: true, options: ['승인됨', '차단됨', '승인 대기'] },
      ],
      fields: [
        { name: '기기 이름', label: '기기 이름', required: true, placeholder: '예: Galaxy Tab A9' },
        { name: '이름', label: '사용자 이름', placeholder: '예: 홍길동' },
        { name: '이메일', label: '이메일', placeholder: '예: student01@practice.senedu.kr' },
        { name: 'OS', label: 'OS', type: 'select', options: MOBILE_OS_OPTIONS },
        { name: '소유권', label: '소유권', type: 'select', options: MOBILE_OWNERSHIP },
      ],
      note: '실제 콘솔에서는 사용자가 기기에서 학교 계정으로 로그인하면 자동으로 목록에 나타납니다. 여기서는 직접 추가하며 흐름을 연습합니다.',
    });
  },
};

const mobileCompanyInventory = {
  render(ctx) {
    return ctx.listPage({
      key: 'company-devices',
      title: '회사 소유 인벤토리',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '학교(조직)가 구매해 배포하는 기기의 일련 번호를 미리 등록합니다.',
      addLabel: '기기 추가',
      emptyTitle: '현재 선택과 일치하는 기기가 없습니다.',
      emptyHint: '일련 번호를 등록해 두면 해당 기기는 등록 즉시 회사 소유 기기로 표시됩니다.',
      columns: [
        { key: '일련 번호', label: '일련 번호' },
        { key: '가져온 날짜', label: '가져온 날짜' },
        { key: '유형', label: '유형' },
        { key: '애셋 태그', label: '애셋 태그' },
        { key: '상태', label: '상태', editable: true, options: ['할당되지 않음', '사용자에게 할당됨', '사용 중지됨'] },
      ],
      fields: [
        { name: '일련 번호', label: '일련 번호', required: true, placeholder: '예: R52T30ABCDE' },
        { name: '유형', label: '유형', type: 'select', options: ['Android', 'iOS', 'Windows', 'ChromeOS'] },
        { name: '애셋 태그', label: '애셋 태그', placeholder: '예: YG-2026-014' },
        { name: '가져온 날짜', label: '가져온 날짜', placeholder: '예: 2026. 9. 12.' },
      ],
    });
  },
};

const mobileDeviceApprovals = {
  render(ctx) {
    return ctx.listPage({
      key: 'device-approvals',
      title: '기기 승인',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '새 기기가 조직 데이터에 접근하기 전에 관리자 승인을 거칩니다.',
      addLabel: '승인 요청 추가',
      emptyTitle: '승인 대기 중인 기기가 없습니다',
      emptyHint: '기기 승인 설정을 켜면 새 기기가 이 목록에 표시됩니다. 연습을 위해 직접 추가해 볼 수 있습니다.',
      columns: [
        { key: '기기', label: '기기' },
        { key: '사용자', label: '사용자' },
        { key: '요청일', label: '요청일' },
        { key: '상태', label: '상태', editable: true, options: ['승인', '거부', '대기'] },
      ],
      fields: [
        { name: '기기', label: '기기', required: true, placeholder: '예: iPhone 16' },
        { name: '사용자', label: '사용자', placeholder: '예: student01@practice.senedu.kr' },
        { name: '요청일', label: '요청일', placeholder: '예: 2026. 9. 12.' },
        { name: '상태', label: '상태', type: 'select', options: ['대기', '승인', '거부'] },
      ],
    });
  },
};

const mobileAppList = {
  render(ctx) {
    return ctx.listPage({
      key: 'mobile-apps',
      title: '앱',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '모바일 기기에 배포할 앱과 배포 방식을 관리합니다.',
      addLabel: '앱 추가',
      emptyTitle: '배포 중인 앱이 없습니다',
      emptyHint: '‘앱 추가’를 눌러 학생·교사 기기에 배포할 앱을 등록해 보세요.',
      columns: [
        { key: '앱 이름', label: '앱 이름' },
        { key: '플랫폼', label: '플랫폼' },
        { key: '배포 방식', label: '배포 방식', editable: true, options: ['강제 설치', '설치 허용', '차단됨'] },
        { key: '적용 조직 단위', label: '적용 조직 단위' },
      ],
      fields: [
        { name: '앱 이름', label: '앱 이름', required: true, placeholder: '예: Google Classroom' },
        { name: '플랫폼', label: '플랫폼', type: 'select', options: ['Android', 'iOS', 'Android · iOS', '웹'] },
        { name: '배포 방식', label: '배포 방식', type: 'select', options: ['강제 설치', '설치 허용', '차단됨'] },
        { name: '적용 조직 단위', label: '적용 조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
      ],
    });
  },
};

const mobileAudit = {
  render(ctx) {
    return ctx.listPage({
      key: 'mobile-audit',
      title: '감사',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '모바일 기기 관련 관리자 작업과 기기 이벤트 로그입니다.',
      addLabel: '이벤트 기록',
      fab: false,
      emptyTitle: '감사 로그가 없습니다',
      emptyHint: '기기를 등록하면 이벤트가 기록됩니다. 연습을 위해 직접 기록해 볼 수도 있습니다.',
      columns: [
        { key: '시간', label: '시간' },
        { key: '이벤트', label: '이벤트' },
        { key: '기기', label: '기기' },
        { key: '관리자', label: '관리자' },
      ],
      fields: [
        { name: '시간', label: '시간', placeholder: '예: 2026. 9. 12. 09:30' },
        { name: '이벤트', label: '이벤트', type: 'select', options: ['기기 등록', '기기 승인', '기기 차단', '계정 초기화', '정책 동기화'] },
        { name: '기기', label: '기기', placeholder: '예: Galaxy Tab A9' },
        { name: '관리자', label: '관리자', placeholder: '예: admin@practice.senedu.kr' },
      ],
    });
  },
};

const mobileRules = {
  render(ctx) {
    return ctx.listPage({
      key: 'mobile-rules',
      title: '규칙',
      breadcrumb: '기기 > 모바일 및 엔드포인트',
      description: '기기 이벤트에 반응해 자동으로 실행되는 규칙을 관리합니다.',
      addLabel: '규칙 만들기',
      emptyTitle: '만든 규칙이 없습니다',
      emptyHint: '‘규칙 만들기’를 눌러 기기 이벤트에 반응하는 자동 규칙을 만들어 보세요.',
      columns: [
        { key: '규칙 이름', label: '규칙 이름' },
        { key: '조건', label: '조건' },
        { key: '작업', label: '작업' },
        { key: '상태', label: '상태', editable: true, options: ['사용 설정됨', '사용 안함'] },
      ],
      fields: [
        { name: '규칙 이름', label: '규칙 이름', required: true, placeholder: '예: 미준수 기기 알림' },
        { name: '조건', label: '조건', type: 'select', options: ['기기가 정책을 준수하지 않음', '새 기기가 등록됨', '기기가 30일 이상 동기화되지 않음', '루팅·탈옥 기기가 감지됨'] },
        { name: '작업', label: '작업', type: 'select', options: ['이메일 알림 전송', '기기 차단', '계정 데이터 초기화', '관리자에게 알림'] },
        { name: '상태', label: '상태', type: 'select', options: ['사용 설정됨', '사용 안함'] },
      ],
    });
  },
};

/* 실제 콘솔 캡처 원문 그대로 — 모바일 및 엔드포인트 > 설정 > Android */
const ANDROID_SETTING_SECTIONS = [
  ['일반', '모든 Android 기기의 일반적인 설정을 관리합니다.', [
    ['자동 완전 삭제', "사용 중지됨: '설정된 기간 내에 기기가 동기화되지 않을 경우 완전 삭제'"],
    ['CTS 규정 준수', "사용 중지됨: 'Android CTS 규정을 준수하지 않는 기기 차단'"],
    ['애플리케이션 감사', "사용 중지됨: '직장 프로필이 없는 개인 기기의 앱을 감사합니다.'"],
    ['사용자 기기 초기화', "사용 중지됨: '사용자가 내 기기 에서 기기를 초기화하도록 허용'"],
    ['이전 Android 기기', "사용 중지됨: '이전 버전의 Android 기기에만 적용할 수 있는 정책 시행'"],
  ]],
  ['직장 프로필', '직장 프로필 요구사항 관리', [
    ['직장 프로필 설정', "사용 설정됨: '직장 프로필을 생성하도록 사용 설정'"],
    ['직장 프로필 비밀번호', "사용 중지됨: '직장 프로필 앱에만 비밀번호 요구사항 적용'"],
  ]],
  ['앱 및 데이터 공유', '이러한 설정은 적용 대상을 명시적으로 지정하지 않는 한, 직장 프로필과 회사 소유의 기기 구성 모두에 적용 가능합니다.', [
    ['사용 가능한 앱', '사용자가 Play 스토어에서 설치할 수 있는 앱 설정: 모든 앱',
      ['사용자가 Play 스토어에서 설치할 수 있는 앱 설정: 모든 앱', '사용자가 Play 스토어에서 설치할 수 있는 앱 설정: 승인된 앱만', '사용자가 Play 스토어에서 설치할 수 있는 앱 설정: 앱 없음']],
    ['시스템 앱', "사용 중지됨: '모두 허용'"],
    ['화면 캡처', "사용 설정됨: '화면 캡처 허용'"],
    ['다른 프로필에 공유', "사용 설정됨: '직장 프로필에서 개인 프로필로 콘텐츠를 공유하도록 허용(직장 프로필이 있는 기기만 해당)'"],
    ['프로필 간 복사', "사용 설정됨: '직장 프로필과 개인 프로필 간 붙여넣기 허용(직장 프로필이 있는 기기만 해당)'"],
    ['Android Beam', "사용 설정됨: '발신 Beam 허용'"],
    ['위치 공유', "사용 설정됨: '위치 공유 허용'"],
    ['Google Play 비공개 앱', "사용 중지됨: '사용자가 Google Play 비공개 앱에 액세스하도록 허용합니다.'"],
    ['런타임 권한', '앱의 런타임 권한 요청에 사용할 기본 옵션을 설정합니다.: 사용자에게 메시지 표시',
      ['앱의 런타임 권한 요청에 사용할 기본 옵션을 설정합니다.: 사용자에게 메시지 표시', '앱의 런타임 권한 요청에 사용할 기본 옵션을 설정합니다.: 자동으로 허용', '앱의 런타임 권한 요청에 사용할 기본 옵션을 설정합니다.: 자동으로 거부']],
    ['앱 설정', "사용 설정됨: '사용자가 앱 설정을 변경하도록 허용(회사 소유 기기만 해당)'"],
    ['앱 인증', "사용 설정됨: '사용자가 Google Play 프로텍트를 사용 중지하도록 허용(회사 소유 기기만 해당)'"],
    ['USB 파일 전송', "사용 설정됨: 'USB 파일 전송 허용(회사 소유 기기만 해당)'"],
    ['알 수 없는 소스', "사용 설정됨: '사용자가 직장 프로필에 알 수 없는 소스의 앱을 설치하지 못하도록 차단'"],
    ['개발자 옵션', "사용 중지됨: '개발자 옵션 허용'"],
    ['비밀번호 관리자', "사용 설정됨: 'Android 15 이상에서 직장 프로필에 Google 비밀번호 관리자 사용 설정'"],
  ]],
  ['네트워크', '회사 소유 기기의 네트워크 관리', [
    ['VPN 액세스', "사용 설정됨: 'VPN 구성 허용'"],
    ['테더링', "사용 설정됨: '테더링 및 Wi-Fi 핫스팟 허용'"],
    ['모바일 네트워크', "사용 설정됨: '모바일 네트워크 설정 변경 허용'"],
    ['셀 브로드캐스트', "사용 설정됨: '셀 브로드캐스트 설정 변경 허용'"],
    ['블루투스', "사용 설정됨: '블루투스 설정 변경 허용'"],
    ['Wi-Fi', "사용 설정됨: 'Wi-Fi 네트워크 설정 변경 허용'"],
  ]],
  ['기기 기능', '회사 소유 기기의 추가 기능 관리', [
    ['물리적 매체', "사용 설정됨: '외부 SD 카드 허용'"],
    ['신뢰할 수 있는 사용자 인증 정보', "사용 설정됨: '신뢰할 수 있는 사용자 인증 정보 변경 허용'"],
    ['마이크', "사용 설정됨: '마이크 허용'"],
    ['스피커', "사용 설정됨: '스피커 허용'"],
    ['관리자 제한 PIN 설정', "사용 중지됨: '관리자 제한 PIN 원격 관리 허용'"],
    ['초기화', "사용 설정됨: '사용자가 기기를 초기화하도록 허용'"],
    ['초기화 방지', '공장 초기화 후 로그인 허용: 관리자 없음',
      ['공장 초기화 후 로그인 허용: 관리자 없음', '공장 초기화 후 로그인 허용: 모든 관리자', '공장 초기화 후 로그인 허용: 지정된 관리자']],
    ['시간 수정', "사용 설정됨: '사용자가 날짜 및 시간을 수정하도록 허용'"],
    ['데이터 로밍', "사용 설정됨: '로밍 시 사용자가 데이터 서비스에 연결하도록 허용'"],
    ['안전 모드 부팅', "사용 설정됨: '사용자가 안전 모드에서 기기를 재부팅하도록 허용합니다.'"],
  ]],
  ['사용자 및 계정', '사용자가 계정을 추가하고 삭제하도록 허용합니다(회사 소유 기기 및 직장 프로필이 있는 기기만 해당).', [
    ['계정', "사용 설정됨: '사용자가 계정을 추가하고 삭제하도록 허용'"],
    ['Google 계정', "사용 설정됨: '사용자가 자신의 Google 계정을 추가하도록 허용'"],
    ['사용자 추가', "사용 설정됨: '사용자가 사용자 프로필을 추가하도록 허용합니다. 이 설정은 Android 6.0을 실행하는 회사 소유 기기에서만 사용할 수 있습니다.'"],
    ['사용자 삭제', "사용 설정됨: '사용자가 사용자 프로필을 삭제하도록 허용합니다. 이 설정은 Android 6.0을 실행하는 회사 소유 기기에서만 사용할 수 있습니다.'"],
  ]],
  ['잠금 화면 기능', '잠긴 기기에서의 알림 및 기타 기능을 관리합니다(Android 6 이상을 실행하는 회사 소유 기기 및 개인 프로필이 없는 기기만 해당).', [
    ['잠금 화면 기능', "사용 설정됨: '잠금 화면 기능 허용'"],
    ['카메라', "사용 중지됨: '카메라 허용'"],
    ['얼굴 인식 잠금 해제', "사용 설정됨: '얼굴 인식 잠금 해제 허용'"],
    ['지문 잠금 해제', "사용 설정됨: '지문 잠금 해제 허용'"],
    ['홍채 인식 잠금 해제', "사용 설정됨: '홍채 인식 잠금 해제 허용'"],
    ['잠금 화면 위젯', "사용 중지됨: '잠금 화면 위젯 허용(Android 5 이하)'"],
    ['알림', "사용 설정됨: '잠금 화면에서 알림 허용'"],
    ['알림 세부정보', "사용 설정됨: '알림 세부정보 허용'"],
    ['PIN, 비밀번호 또는 패턴을 사용한 주기적 인증', "사용 중지됨: '얼굴 인식 잠금 해제 또는 지문 잠금 해제 사용자에게 PIN, 비밀번호, 패턴 등 더 안전한 방법을 사용해 주기적으로 인증하도록 요구합니다.'"],
    ['Trust Agent', "사용 설정됨: 'Smart Lock에서 기기의 잠금 해제 상태를 유지하도록 허용'"],
  ]],
  ['시스템 업데이트', '시스템 업데이트 설치 시간 관리', [
    ['OS 업데이트 정책', 'OS 업데이트를 자동 푸시할 시점 선택: 사용 안함',
      ['OS 업데이트를 자동 푸시할 시점 선택: 사용 안함', 'OS 업데이트를 자동 푸시할 시점 선택: 즉시 적용', 'OS 업데이트를 자동 푸시할 시점 선택: 30일 지연']],
  ]],
  ['지원 메시지', '사용자 대상 지원 메시지 관리', [
    ['강제 설정', '조직의 기기 정책으로 인해 설정을 변경할 수 없는 경우 사용자에게 표시할 메시지 선택: 조직 정책으로 인해 설정을 변경할 수 없으며 관리자에게 자세한 내용을 문의하도록 안내하는 기본 메시지',
      ['조직의 기기 정책으로 인해 설정을 변경할 수 없는 경우 사용자에게 표시할 메시지 선택: 조직 정책으로 인해 설정을 변경할 수 없으며 관리자에게 자세한 내용을 문의하도록 안내하는 기본 메시지', '맞춤 메시지 사용']],
    ['직장 프로필 완전 삭제', '기기에서 직장 프로필이 삭제된 경우 사용자에게 표시할 메시지 선택: 직장 프로필이 삭제되었으며 관리자에게 자세한 내용을 문의하도록 안내하는 기본 메시지',
      ['기기에서 직장 프로필이 삭제된 경우 사용자에게 표시할 메시지 선택: 직장 프로필이 삭제되었으며 관리자에게 자세한 내용을 문의하도록 안내하는 기본 메시지', '맞춤 메시지 사용']],
  ]],
];

const mobileAndroidSettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > Android',
    title: 'Android 설정', prefix: 'Android',
    sections: ANDROID_SETTING_SECTIONS,
  }),
};

const mobileIosSettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > iOS',
    title: 'iOS 설정', prefix: 'iOS',
    sections: [
      ['일반', '모든 iOS 기기의 일반적인 설정을 관리합니다.', [
        ['감독 모드', "사용 중지됨: '감독 모드(Supervised) 기기만 조직 데이터에 접근하도록 허용'"],
        ['앱 설치 제한', "사용 중지됨: 'App Store에서 임의의 앱 설치 차단'"],
        ['iCloud 백업', "사용 설정됨: '관리 계정 데이터의 iCloud 백업 허용'"],
        ['카메라', "사용 설정됨: '카메라 허용'"],
        ['Safari', "사용 설정됨: 'Safari 사용 허용'"],
      ]],
    ],
  }),
};

const mobileWindowsSettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > Windows',
    title: 'Windows 설정', prefix: 'Windows',
    sections: [
      ['일반', 'Windows 10/11 기기의 관리 설정을 관리합니다.', [
        ['BitLocker', "사용 설정됨: '드라이브 암호화(BitLocker) 요구'"],
        ['Windows 업데이트', "사용 설정됨: '보안 업데이트 자동 설치'"],
        ['Windows Hello', "사용 설정됨: '생체 인증 로그인 허용'"],
        ['로컬 관리자 권한', "사용 중지됨: '학교 계정 사용자에게 로컬 관리자 권한 부여'"],
      ]],
    ],
  }),
};

const mobileGeneralSettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > 범용',
    title: '범용 설정', prefix: '범용',
    sections: [
      ['보안', '모든 모바일 기기에 공통으로 적용되는 보안 요구사항입니다.', [
        ['화면 잠금', "사용 설정됨: '기기에 화면 잠금 또는 비밀번호 요구'"],
        ['기기 암호화', "사용 설정됨: '조직 데이터를 저장하는 기기의 암호화 요구'"],
        ['원격 초기화', "사용 설정됨: '관리자가 분실 기기에서 학교 계정 데이터를 지우도록 허용'"],
      ]],
      ['기기 관리', '기기 승인과 정책 미준수 기기 처리 방식입니다.', [
        ['기기 승인', "사용 설정됨: '새 기기가 조직 데이터에 접근하기 전 관리자 승인 필요'"],
        ['미준수 기기 차단', "사용 중지됨: '정책을 준수하지 않는 기기의 동기화 차단'"],
        ['비활성 기기 알림', "사용 중지됨: '30일 이상 동기화되지 않은 기기를 관리자에게 알림'"],
      ]],
    ],
  }),
};

const mobileEnrollSettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > 등록',
    title: '등록', prefix: '등록',
    sections: [
      ['등록', '기기를 조직에 등록하는 방식을 관리합니다.', [
        ['기기 등록 허용', "사용 설정됨: '사용자가 자신의 기기를 조직에 등록하도록 허용'"],
        ['등록 시 승인 필요', "사용 중지됨: '기기 등록 시 관리자 승인 필요'"],
        ['등록 안내 이메일', "사용 설정됨: '새 기기 등록 시 사용자에게 안내 이메일 발송'"],
      ]],
    ],
  }),
};

const mobileThirdPartySettings = {
  render: (ctx) => mobileSettingsPage(ctx, {
    crumb: '기기 > 모바일 및 엔드포인트 > 설정 > 타사 통합',
    title: '타사 통합', prefix: '타사 통합',
    sections: [
      ['EMM 통합', '타사 EMM(엔터프라이즈 모빌리티 관리) 파트너와의 연동을 관리합니다.', [
        ['타사 EMM 사용', "사용 중지됨: 'Google 엔드포인트 관리 대신 타사 EMM으로 기기 관리'"],
        ['API 액세스', "사용 설정됨: 'EMM 파트너가 기기 관리 API에 액세스하도록 허용'"],
        ['인증서 배포', "사용 중지됨: '타사 인증 기관(CA) 인증서 자동 배포'"],
      ]],
    ],
  }),
};

const mobileReports = {
  render(ctx) {
    const rows = ctx.collection('mobile-devices');
    const company = ctx.collection('company-devices');
    const apps = ctx.collection('mobile-apps');
    const approvals = ctx.collection('device-approvals');
    return `<div class="section-page wide admin-page">
      ${ctx.crumb('기기 > 모바일 및 엔드포인트 > 보고서')}
      <h1>보고서</h1>
      <p class="page-desc">모바일 기기 등록 현황과 인벤토리 통계입니다. 다른 화면에서 추가한 연습 데이터가 집계됩니다.</p>
      <div class="report-cards">
        <article><small>등록 기기</small><h3>사용자 기기</h3><strong>${rows.length}</strong><span class="delta">대</span></article>
        <article><small>회사 소유 인벤토리</small><h3>일련 번호</h3><strong>${company.length}</strong><span class="delta">대</span></article>
        <article><small>배포 앱</small><h3>모바일 앱</h3><strong>${apps.length}</strong><span class="delta">개</span></article>
        <article><small>승인 요청</small><h3>기기 승인</h3><strong>${approvals.length}</strong><span class="delta">건</span></article>
      </div>
      <div class="data-panel flat">
        ${rows.length ? `<table class="admin-table">
          <thead><tr><th>기기 이름</th><th>이름</th><th>이메일</th><th>OS</th><th>소유권</th></tr></thead>
          <tbody>${rows.map((r) => `<tr>
            <td><b class="blue-text">${ctx.esc(r['기기 이름'] || '—')}</b></td>
            <td>${ctx.esc(r['이름'] || '—')}</td>
            <td>${ctx.esc(r['이메일'] || '—')}</td>
            <td>${ctx.esc(r['OS'] || '—')}</td>
            <td>${ctx.esc(r['소유권'] || '—')}</td>
          </tr>`).join('')}</tbody>
        </table>` : `<div class="empty-hint">등록된 기기가 없습니다. ‘기기’ 화면에서 기기를 추가하면 여기에 집계됩니다.</div>`}
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
  ['iPad (교사용)', 'iPadOS 18', 'teacher01@practice.senedu.kr', '승인됨', '2026. 9. 11.'],
  ['Galaxy Tab A9', 'Android 15', 'student01@practice.senedu.kr', '승인됨', '2026. 9. 10.'],
  ['iPhone 16', 'iOS 19', 'admin@practice.senedu.kr', '승인 대기', '2026. 9. 9.'],
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
  'Chrome/보고서': reuse(chromeViews['보고서/개요'], '기기 > Chrome > 보고서'),
  'Chrome/웹 기능': {
    render(ctx) {
      return ctx.listPage({
        key: 'web-features',
        title: '웹 기능',
        breadcrumb: '기기 > Chrome',
        description: 'ChromeOS 기기에서 사용할 웹앱과 바로가기를 배포합니다.',
        addLabel: '웹앱 추가',
        emptyTitle: '아직 배포한 웹앱이 없습니다',
        columns: [
          { key: 'name', label: '이름' },
          { key: 'url', label: 'URL' },
          { key: 'policy', label: '설치 정책', editable: true, options: ['강제 설치', '설치 허용', '차단'] },
          { key: 'ou', label: '적용 조직 단위' },
        ],
        fields: [
          { name: 'name', label: '이름', required: true, placeholder: '예: 학교 홈페이지' },
          { name: 'url', label: 'URL', required: true, placeholder: 'https://' },
          { name: 'policy', label: '설치 정책', type: 'select', options: ['강제 설치', '설치 허용', '차단'] },
          { name: 'ou', label: '적용 조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
        ],
      });
    },
  },
  'Chrome/프린터': {
    render(ctx) {
      return ctx.listPage({
        key: 'printers',
        title: '프린터',
        breadcrumb: '기기 > Chrome',
        description: 'ChromeOS 기기에 배포할 프린터를 등록합니다.',
        addLabel: '프린터 추가',
        emptyTitle: '아직 등록된 프린터가 없습니다',
        columns: [
          { key: 'name', label: '프린터 이름' },
          { key: 'model', label: '제조사 및 모델' },
          { key: 'protocol', label: '프로토콜', editable: true, options: ['ipp', 'ipps', 'lpd', 'socket'] },
          { key: 'ou', label: '적용 조직 단위' },
        ],
        fields: [
          { name: 'name', label: '프린터 이름', required: true, placeholder: '예: 교무실 복합기' },
          { name: 'model', label: '제조사 및 모델', placeholder: '예: Samsung SL-X4300' },
          { name: 'protocol', label: '프로토콜', type: 'select', options: ['ipp', 'ipps', 'lpd', 'socket'] },
          { name: 'ou', label: '적용 조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
        ],
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
      /* 네트워크 유형별 컬렉션 — 실제 콘솔처럼 유형마다 따로 만든다 */
      const NET_TYPES = [
        ['net-wifi', 'Wi-Fi'],
        ['net-ethernet', '이더넷'],
        ['net-vpn', 'VPN'],
        ['net-cellular', '셀룰러'],
      ];
      NET_TYPES.forEach(([key, label]) => ctx.defineList(key, {
        title: `${label} 네트워크`,
        addLabel: `${label} 네트워크 생성`,
        fields: [
          { name: 'name', label: '이름', required: true, placeholder: `예: School-${label === 'Wi-Fi' ? 'WiFi' : label}` },
          { name: 'ssid', label: 'SSID 또는 주소', placeholder: '예: SCHOOL-2G' },
          { name: 'security', label: '보안', type: 'select', options: ['WPA2-PSK', 'WPA2-Enterprise', '개방형'] },
          { name: 'ou', label: '적용 조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
        ],
      }));
      ctx.defineList('net-scep', {
        title: 'SCEP 프로필',
        addLabel: 'SCEP 프로필 만들기',
        fields: [
          { name: 'name', label: '프로필 이름', required: true, placeholder: '예: 학교 기기 인증서' },
          { name: 'url', label: 'CA URL', placeholder: 'https://' },
          { name: 'ou', label: '적용 조직 단위', type: 'select', options: OU_FIELD_OPTIONS },
        ],
      });

      const netCard = ([key, label]) => {
        const rows = ctx.collection(key);
        const body = rows.length
          ? `<div class="table-wrap"><table class="admin-table">
              <thead><tr><th>이름</th><th>SSID</th><th>보안</th><th>적용 OU</th><th class="col-actions"></th></tr></thead>
              <tbody>${rows.map((r) => `<tr>
                <td><b class="blue-text">${ctx.esc(r.name || '—')}</b></td>
                <td>${ctx.esc(r.ssid || '—')}</td>
                <td>${ctx.esc(r.security || '—')}</td>
                <td>${ctx.esc(r.ou || '연습학교')}</td>
                <td class="col-actions"><button class="row-action danger" data-action="delete-record" data-key="${ctx.esc(key)}" data-id="${ctx.esc(r.id)}" title="삭제">${ctx.icon('delete', 18)}</button></td>
              </tr>`).join('')}</tbody>
            </table></div>`
          : `<div style="text-align:center;padding:22px 0;color:#5f6368">
              <p style="margin:0 0 8px">${ctx.esc(label)} 네트워크 없음</p>
              <button class="link-btn" data-add="${ctx.esc(key)}">${ctx.esc(label)} 네트워크 생성</button>
            </div>`;
        return `<article class="settings-card">
          <header><div><h2>${ctx.esc(label)}</h2></div>${ctx.icon('expand_more', 18)}</header>
          ${body}
        </article>`;
      };

      const certItem = (label, value, sub, options) => `<div>
        <strong>${ctx.esc(label)}</strong>
        ${ctx.editable({ scope: 'networks', name: `네트워크 · ${label}`, value, options, section: '네트워크' })}
        ${sub ? `<small class="muted-id">${ctx.esc(sub)}</small>` : ''}
      </div>`;

      const certCard = `<article class="settings-card">
        <header><div><h2>인증서</h2><p>서버 CA 인증서를 업로드하고 인증서 프로비저닝을 구성합니다.</p></div>${ctx.icon('expand_more', 18)}</header>
        <div class="settings-card-grid">
          ${certItem('서버 인증 기관 인증서', '서버 인증 기관 인증서 없음', 'Google 기본값에서 상속됨', ['서버 인증 기관 인증서 없음', '인증서 업로드됨'])}
          ${certItem('인증 기관 연결', '인증 기관 연결 없음', '도메인 전체', ['인증 기관 연결 없음', '인증 기관 연결됨'])}
          ${certItem('인증서 프로비저닝 프로필', '인증서 프로비저닝 프로필 없음', '', ['인증서 프로비저닝 프로필 없음', '프로필 구성됨'])}
        </div>
      </article>`;

      const scepRows = ctx.collection('net-scep');
      const scepCard = `<article class="settings-card">
        <header><div><h2>보안 SCEP</h2><p>SCEP를 사용하여 비공개 CA에서 관리 기기에 발급한 인증서를 배포할 수 있습니다.</p></div>${ctx.icon('expand_more', 18)}</header>
        ${scepRows.length
          ? `<div class="table-wrap"><table class="admin-table">
              <thead><tr><th>프로필 이름</th><th>CA URL</th><th>적용 OU</th><th class="col-actions"></th></tr></thead>
              <tbody>${scepRows.map((r) => `<tr>
                <td><b class="blue-text">${ctx.esc(r.name || '—')}</b></td>
                <td>${ctx.esc(r.url || '—')}</td>
                <td>${ctx.esc(r.ou || '연습학교')}</td>
                <td class="col-actions"><button class="row-action danger" data-action="delete-record" data-key="net-scep" data-id="${ctx.esc(r.id)}" title="삭제">${ctx.icon('delete', 18)}</button></td>
              </tr>`).join('')}</tbody>
            </table></div>`
          : `<div style="text-align:center;padding:22px 0;color:#5f6368">
              <p style="margin:0 0 8px">SCEP 프로필이 없습니다.</p>
              <button class="link-btn" data-add="net-scep">SCEP 프로필 만들기</button>
            </div>`}
      </article>`;

      const GENERAL_ITEMS = [
        ['자동 연결', '제한 없음'],
        ['Wi-Fi 네트워크', '제한 없음'],
        ['APN 구성', '제한 없음'],
        ['셀룰러 네트워크', '제한 없음'],
        ['SIM 잠금', '제한 없음'],
        ['핫스팟', '제한 없음'],
        ['허용된 네트워크 인터페이스', 'Wi-Fi, 이더넷, 셀룰러, VPN'],
        ['Wi-Fi 네트워크 차단됨', '차단된 Wi-Fi 네트워크 없음'],
        ['SIM 문자 메시지', '사용자가 결정하도록 허용'],
        ['이더넷 연결 시 Wi-Fi 연결 해제', '사용자가 결정하도록 허용'],
      ];
      const generalCard = `<article class="settings-card">
        <header><div><h2>일반 설정</h2><p>Chromebook 전용</p></div>${ctx.icon('expand_more', 18)}</header>
        <div class="settings-card-grid">
          ${GENERAL_ITEMS.map(([label, value]) => `<div>
            <strong>${ctx.esc(label)}</strong>
            ${ctx.editable({ scope: 'networks', name: `네트워크 · ${label}`, value, options: defaultOptions(value), section: '네트워크' })}
            <small class="muted-id">Google 기본값에서 상속됨</small>
          </div>`).join('')}
        </div>
      </article>`;

      return `<div class="section-page wide admin-page">
        ${ctx.crumb('기기 > 네트워크')}
        <div class="dir-settings-layout">
          <div>
            <div class="dir-settings-hero">
              <div class="section-icon">${ctx.icon('wifi', 26)}</div>
              <h1>네트워크</h1>
              <p class="page-desc">Wi-Fi, 이더넷, VPN 프로필을 기기에 배포합니다.</p>
            </div>
            ${ctx.ouPicker(ctx.currentOu())}
          </div>
          <div class="settings-cards">
            ${NET_TYPES.map(netCard).join('')}
            ${certCard}
            ${scepCard}
            ${generalCard}
          </div>
        </div>
      </div>`;
    },
  },
};

/* ---- 모바일 및 엔드포인트: 화면 등록 (캡처 기반 구현 통합) ---- */

/** 실제 콘솔의 보고서 화면 — SVG 라인 차트 */
const mobileChartReports = {
  render(ctx) {
    const devices2 = ctx.collection('mobile-devices');
    const android = devices2.filter((d) => String(d['OS'] || d.os || '').includes('Android')).length;
    const ios = devices2.filter((d) => /iOS|iPadOS/.test(String(d['OS'] || d.os || ''))).length;
    const XL = ['3월 12일', '3월 30일', '4월 17일', '5월 5일', '5월 24일', '6월 11일', '7월 3일', '7월 21일', '8월 8일', '8월 26일', '9월 8일'];
    const BASE = [9, 9, 5, 5, 5, 5, 5, 5, 17, 8, 5];
    const IOSB = [3, 2, 2, 2, 3, 2, 2, 2, 2, 3, 2];

    const chart = (title, series) => {
      const W = 1000; const H = 220; const TOP = 10; const MAX = 20;
      const x = (i) => 40 + (i * (W - 80)) / (XL.length - 1);
      const y = (v) => TOP + (H - TOP - 40) * (1 - Math.min(v, MAX) / MAX);
      const grid = [0, 5, 10, 15, 20].map((v) => `<line x1="40" x2="${W - 40}" y1="${y(v)}" y2="${y(v)}" stroke="#e8eaed"/>
        <text x="${W - 28}" y="${y(v) + 4}" font-size="11" fill="#80868b">${v}</text>`).join('');
      const lines = series.map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="2"
        points="${s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>`).join('');
      const labels = XL.map((l, i) => `<text x="${x(i)}" y="${H - 18}" font-size="11" fill="#5f6368" text-anchor="middle">${l}</text>`).join('');
      return `<article class="data-panel flat" style="padding:20px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="margin:0;font-size:16px;font-weight:500">${ctx.esc(title)}</h3>
          <button class="link-btn" data-toast="다운로드">${ctx.icon('download', 16)} 다운로드</button>
        </div>
        <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="${ctx.esc(title)}">${grid}${lines}${labels}</svg>
        <div class="chart-legend">${series.map((s) => `<label><span class="legend-box" style="background:${s.color}">${ctx.icon('check', 14)}</span>${ctx.esc(s.name)}</label>`).join('')}</div>
      </article>`;
    };

    const syncSeries = [
      { name: 'Android 동기화', color: '#4285f4', data: BASE.map((v) => v + android) },
      { name: 'Google Sync', color: '#ea4335', data: BASE.map(() => 0) },
      { name: 'iOS 동기화', color: '#fbbc04', data: IOSB.map((v) => v + ios) },
    ];
    const PALETTE = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#a142f4', '#00acc1', '#f4511e', '#7cb342', '#3949ab', '#ec407a'];
    const versionCard = (title, items) => `<article class="data-panel flat" style="padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:16px;font-weight:500">${ctx.esc(title)}</h3>
        <button class="link-btn" data-toast="다운로드">${ctx.icon('download', 16)} 다운로드</button>
      </div>
      <svg viewBox="0 0 1000 150" style="width:100%;height:auto"><line x1="40" x2="960" y1="120" y2="120" stroke="#4285f4" stroke-width="2"/>
        ${[0, 1, 2, 3, 4].map((v, i) => `<text x="972" y="${120 - i * 25}" font-size="11" fill="#80868b">${v}</text>`).join('')}</svg>
      <div class="chart-legend">${items.map((n, i) => `<label><span class="legend-box" style="background:${PALETTE[i % PALETTE.length]}">${ctx.icon('check', 14)}</span>${ctx.esc(n)}</label>`).join('')}</div>
    </article>`;

    return `<div class="section-page wide admin-page">
      ${ctx.crumb('보고서 > 앱 보고서 > 모바일')}
      <div class="page-title-row"><div><h1>모바일</h1></div><button class="link-btn" data-nav="devices::모바일 및 엔드포인트/보고서 규칙 관리">보고서 관리</button></div>
      ${chart('관리 기기(7DA) 수', syncSeries)}
      ${chart('관리 기기(30DA) 수', syncSeries)}
      ${chart('관리 사용자(7DA) 수', syncSeries)}
      ${chart('관리 사용자(30DA) 수', syncSeries)}
      ${versionCard('관리 Android 기기(7DA) 수', ['v4.4', 'v5.0', 'v6.0', 'v7.0', 'v8.0', 'v9.0', 'v10.0', 'v11.0', 'v12.0', 'v13.0', 'v14.0', 'v15.0'])}
      ${versionCard('관리 iOS 기기(7DA) 수', ['iOS 12.0', 'iOS 13.0', 'iOS 14.0', 'iOS 15.0', 'iOS 16.0', 'iOS 17.0', 'iOS 18.0', 'iOS 26.0'])}
    </div>`;
  },
};

/** 실제 콘솔의 감사 및 조사(조사 도구 검색) 화면 */
const mobileAuditSearch = {
  render(ctx) {
    return `<div class="section-page wide admin-page">
      ${ctx.crumb('보고 > 감사 및 조사')}
      <div class="data-panel flat" style="padding:20px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          ${ctx.icon('search', 22)}<h2 style="margin:0;font-size:18px;font-weight:500">검색</h2>
          <button class="link-btn" data-toast="활동 규칙 생성">활동 규칙 생성</button>
          <button class="link-btn" data-toast="설정">설정</button>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
          ${ctx.editable({ scope: 'mobile-audit', name: '데이터 소스', value: '기기 로그 이벤트', section: '감사 및 조사', options: ['기기 로그 이벤트', '관리자 로그 이벤트', '사용자 로그 이벤트'] })}
          <button class="link-btn" style="border-bottom:3px solid var(--g-blue);padding-bottom:6px">필터</button>
          <button class="link-btn" style="color:#5f6368" data-toast="조건 작성 도구">조건 작성 도구</button>
        </div>
        <div class="practice-strip" style="margin:0 0 14px">${ctx.icon('info', 20)}<span>검색은 기본값으로 지난 7일로 기간이 설정됩니다. 필요에 따라 기간을 변경하세요.</span></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#e8eaed;font-size:13px">날짜: 이후: 26. 9. 5. ${ctx.icon('close', 14)}</span>
          <button class="link-btn" data-toast="필터 추가">${ctx.icon('add', 16)} 필터 추가</button>
          <span style="flex:1"></span>
          <button class="link-btn" data-toast="필터 지우기">필터 지우기</button>
        </div>
        <button class="link-btn" data-toast="검색">검색</button>
        <hr style="border:0;border-top:1px solid var(--g-divider);margin:14px 0">
        <p style="padding:60px 20px;text-align:center;color:#5f6368;margin:0">일치하는 결과가 없습니다. 검색 조건을 확인하고 다시 시도해 보세요. 로그 이벤트를 검색 중인 경우 해당 로그가 더 이상 사용할 수 없는 로그일 수 있습니다. 기기 로그 이벤트 데이터 소스는 일부 버전에서만 사용할 수 있습니다.</p>
      </div>
    </div>`;
  },
};

/** 기기 > 보안 규칙 (기기 관리 규칙) */
const deviceMgmtRules = {
  render(ctx) {
    return ctx.listPage({
      key: 'device-mgmt-rules',
      title: '기기 관리',
      breadcrumb: '기기 > 보안 규칙',
      description: '모든 규칙 표시 중',
      addLabel: '규칙 추가',
      emptyTitle: '아직 아무 규칙도 추가하지 않았습니다.',
      columns: [
        { key: 'name', label: '이름' },
        { key: 'status', label: '상태', editable: true, options: ['활성', '활동 안함'] },
        { key: 'action', label: '작업' },
        { key: 'type', label: '규칙 유형' },
        { key: 'modified', label: '최종 수정 시간' },
      ],
      fields: [
        { name: 'name', label: '규칙 이름', required: true, placeholder: '예: 5회 로그인 실패 시 기기 차단' },
        { name: 'action', label: '작업', type: 'select', options: ['기기 차단', '계정 초기화', '알림 보내기'] },
        { name: 'type', label: '규칙 유형', type: 'select', options: ['기기 관리', '활동 규칙'] },
        { name: 'modified', label: '최종 수정 시간', placeholder: '2026. 9. 12.' },
      ],
    });
  },
};

Object.assign(devices, {
  '모바일 및 엔드포인트/기기': mobileDeviceList,
  '모바일 및 엔드포인트/회사 소유 인벤토리': mobileCompanyInventory,
  '모바일 및 엔드포인트/기기 승인': mobileDeviceApprovals,
  '모바일 및 엔드포인트/앱': mobileAppList,
  '모바일 및 엔드포인트/보고서': mobileChartReports,
  '모바일 및 엔드포인트/감사': mobileAuditSearch,
  '모바일 및 엔드포인트/보고서 규칙 관리': mobileRules,
  '모바일 및 엔드포인트/규칙': deviceMgmtRules,
}, mobileSettings);

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
  '액세스 및 데이터 관리': {
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
      return ctx.listPage({
        key: 'alerts',
        title: '경고 센터',
        breadcrumb: '보안',
        description: '보안 및 규정 준수 관련 알림을 확인합니다. (최고 관리자 전용)',
        addLabel: '알림 규칙 만들기',
        fab: false,
        emptyTitle: '표시할 알림이 없습니다',
        columns: [
          { key: 'name', label: '알림' },
          { key: 'severity', label: '심각도', editable: true, options: ['심각', '보통', '낮음'] },
          { key: 'time', label: '발생 시각' },
          { key: 'status', label: '상태', editable: true, options: ['검토 필요', '진행 중', '해결됨'] },
        ],
        fields: [
          { name: 'name', label: '알림 이름', required: true, placeholder: '예: 의심스러운 로그인 시도' },
          { name: 'severity', label: '심각도', type: 'select', options: ['심각', '보통', '낮음'] },
          { name: 'time', label: '발생 시각', placeholder: '예: 2026. 9. 12. 09:00' },
          { name: 'status', label: '상태', type: 'select', options: ['검토 필요', '진행 중', '해결됨'] },
        ],
      });
    },
  },
};

/* ---- 보안: 실제 콘솔 메뉴에 맞춘 추가 화면 ---- */
Object.assign(security, {
  '알림 센터': {
    render(ctx) {
      return ctx.listPage({
        key: 'alerts',
        title: '알림',
        breadcrumb: '보안 > 알림 센터',
        description: '보안 및 규정 관련 알림을 확인합니다.',
        addLabel: '알림 추가',
        emptyTitle: '표시할 알림이 없습니다',
        emptyHint: '조직에서 보안 이벤트가 발생하면 여기에 표시됩니다.',
        columns: [
          { key: 'name', label: '알림' },
          { key: 'severity', label: '심각도', editable: true, options: ['심각', '보통', '낮음'] },
          { key: 'time', label: '발생 시각' },
          { key: 'status', label: '상태', editable: true, options: ['검토 필요', '진행 중', '해결됨'] },
        ],
        fields: [
          { name: 'name', label: '알림 이름', required: true, placeholder: '예: 의심스러운 로그인 감지' },
          { name: 'severity', label: '심각도', type: 'select', options: ['심각', '보통', '낮음'] },
          { name: 'time', label: '발생 시각', placeholder: '2026. 9. 12. 09:00' },
        ],
      });
    },
  },
  '인증/계정 복구': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 계정 복구', title: '계정 복구', ou: true,
      desc: '사용자와 관리자가 비밀번호를 잊었을 때 계정을 복구하는 방법을 설정합니다.',
      cards: [
        ['사용자 계정 복구', '사용자가 직접 계정을 복구할 수 있는지 설정합니다.', [['상태', '사용 안함']]],
        ['최고 관리자 계정 복구', '최고 관리자의 자가 복구 허용 여부입니다.', [['상태', '사용 안함']]],
      ],
    }),
  },
  '인증/본인 확인 요청': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 본인 확인 요청', title: '본인 확인 요청',
      desc: '위험한 로그인 시도가 감지되면 사용자에게 본인 확인을 요청합니다.',
      cards: [
        ['로그인 시 본인 확인', '평소와 다른 기기·위치에서 추가 확인을 요구합니다.', [['상태', '사용 설정됨']]],
        ['확인 방법', '허용되는 본인 확인 수단입니다.', [['수단', '복구 전화, 복구 이메일, 직원 ID']]],
      ],
    }),
  },
  '인증/패스워드리스': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 패스워드리스', title: '패스워드리스',
      desc: '비밀번호 없이 패스키로 로그인하도록 허용합니다.',
      cards: [['패스키 로그인', '사용자가 비밀번호 대신 패스키를 사용할 수 있습니다.', [['상태', '사용 안함'], ['적용 대상', '연습학교']]]],
    }),
  },
  '인증/SAML 애플리케이션을 통한 SSO': {
    render(ctx) {
      return ctx.listPage({
        key: 'saml-apps',
        title: 'SAML 앱',
        breadcrumb: '보안 > 인증 > SAML 애플리케이션을 통한 SSO',
        description: 'Google을 ID 공급업체(IdP)로 사용해 외부 앱에 로그인합니다.',
        addLabel: '앱 추가',
        emptyTitle: '설정된 SAML 앱이 없습니다',
        columns: [
          { key: 'name', label: '앱 이름' },
          { key: 'acs', label: 'ACS URL' },
          { key: 'status', label: '상태', editable: true, options: ['사용 설정됨', '사용 중지됨'] },
        ],
        fields: [
          { name: 'name', label: '앱 이름', required: true, placeholder: '예: 학교 학습관리시스템' },
          { name: 'acs', label: 'ACS URL', placeholder: 'https://' },
        ],
      });
    },
  },
  '인증/타사 IdP를 통한 SSO': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 타사 IdP를 통한 SSO', title: '타사 IdP를 통한 SSO',
      desc: '외부 ID 공급업체(IdP)로 Google에 로그인하도록 설정합니다.',
      cards: [
        ['SSO 프로필', '외부 IdP 연결 프로필입니다.', [['프로필', '없음'], ['적용 대상', '설정 안됨']]],
        ['도메인별 SSO', '레거시 도메인 전체 SSO 설정입니다.', [['상태', '사용 안함']]],
      ],
    }),
  },
  '인증/복수 사용자 승인 체계 요청': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 복수 사용자 승인 체계 요청', title: '복수 사용자 승인 체계 요청',
      desc: '민감한 관리자 작업에 다른 관리자의 승인을 요구한 요청 목록입니다.',
      cards: [['대기 중인 요청', '검토가 필요한 승인 요청입니다.', [['대기 중', '0건'], ['완료됨', '0건']]]],
    }),
  },
  '인증/복수 사용자 승인 체계 설정': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 인증 > 복수 사용자 승인 체계 설정', title: '복수 사용자 승인 체계 설정',
      desc: '민감한 작업에 복수 관리자의 승인을 요구할지 설정합니다.',
      cards: [['복수 승인 정책', '2단계 인증 설정 변경 등 민감한 작업에 적용됩니다.', [['상태', '사용 안함']]]],
    }),
  },
  '액세스 및 데이터 관리/데이터 분류': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > 데이터 분류', title: '데이터 분류',
      desc: '라벨을 사용해 Drive 파일 등을 분류합니다.',
      cards: [['분류 라벨', 'Drive 항목에 적용할 수 있는 라벨입니다.', [['활성 라벨', '0개'], ['적용 대상', '연습학교']]]],
    }),
  },
  '액세스 및 데이터 관리/라벨 관리자': {
    render(ctx) {
      return ctx.listPage({
        key: 'labels',
        title: '라벨',
        breadcrumb: '보안 > 액세스 및 데이터 관리 > 라벨 관리자',
        description: '조직에서 사용할 분류 라벨을 만듭니다.',
        addLabel: '라벨 만들기',
        emptyTitle: '만든 라벨이 없습니다',
        columns: [
          { key: 'name', label: '라벨 이름' },
          { key: 'type', label: '유형' },
          { key: 'status', label: '상태', editable: true, options: ['게시됨', '초안', '사용 중지됨'] },
        ],
        fields: [
          { name: 'name', label: '라벨 이름', required: true, placeholder: '예: 대외비' },
          { name: 'type', label: '유형', type: 'select', options: ['배지', '옵션 목록', '텍스트'] },
        ],
      });
    },
  },
  '액세스 및 데이터 관리/Google 세션 제어': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > Google 세션 제어', title: 'Google 세션 제어', ou: true,
      desc: '웹 세션이 만료되어 다시 로그인해야 하는 주기를 설정합니다.',
      cards: [['세션 길이', 'Google 서비스 웹 세션 유지 시간입니다.', [['세션 만료', '14일'], ['적용 대상', '연습학교']]]],
    }),
  },
  '액세스 및 데이터 관리/Google Cloud 세션 관리': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > Google Cloud 세션 관리', title: 'Google Cloud 세션 관리', ou: true,
      desc: 'Google Cloud 콘솔·gcloud CLI의 재인증 주기를 설정합니다.',
      cards: [['재인증 정책', 'Cloud 세션이 만료되는 주기입니다.', [['세션 길이', '16시간'], ['재인증 방법', '비밀번호']]]],
    }),
  },
});

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
      return ctx.listPage({
        key: 'data-exports',
        title: '가져오기 및 내보내기',
        breadcrumb: '데이터',
        description: '조직 데이터를 내보내거나 가져온 기록입니다.',
        addLabel: '새 내보내기',
        emptyTitle: '아직 가져오기·내보내기 기록이 없습니다',
        columns: [
          { key: 'job', label: '작업' },
          { key: 'requester', label: '요청자' },
          { key: 'date', label: '요청일' },
          { key: 'status', label: '상태', editable: true, options: ['진행 중', '완료', '실패'] },
        ],
        fields: [
          { name: 'job', label: '작업 이름', required: true, placeholder: '예: 사용자 목록 내보내기' },
          { name: 'requester', label: '요청자', placeholder: '예: admin@practice.senedu.kr' },
          { name: 'date', label: '요청일', type: 'date' },
          { name: 'status', label: '상태', type: 'select', options: ['진행 중', '완료', '실패'] },
        ],
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

/* ---- 규칙 — 실제 콘솔 캡처 원문 재현 ---- */
const RULE_CARDS = [
  ['Google의 사용자 보호 기본 설정', '시스템 정의 규칙을 사용하면 피싱, 멀웨어, 의심스러운 활동과 같은 중요한 이벤트가 조직에서 발생할 때 사용자에게 알림이 전송됩니다. 자세히 알아보기', ['목록 보기']],
  ['안전한 공동작업', 'Drive 공유 설정이 신뢰 규칙으로 전환되었습니다. 신뢰 규칙이 활성화되었지만 내부 및 외부 공유를 해당 규칙으로 제어하려면 규칙을 사용 설정해야 합니다. 자세히 알아보기', ['Drive에 사용 설정', '목록 보기']],
  ['민감한 콘텐츠 분류 및 보호', '데이터 보호 규칙을 사용하여 분류 라벨을 적용하거나 사용자가 특정 조건을 충족하는 콘텐츠를 공유하지 못하도록 합니다. 자세히 알아보기', ['목록 보기', '규칙 만들기']],
  ['이벤트 모니터링', '활동 규칙을 사용하여 특정 조건을 충족하는 이벤트를 모니터링합니다. 자세히 알아보기', ['목록 보기', '규칙 만들기']],
  ['기기 관리 및 보호', '기기 관리 규칙을 사용하여 기기를 모니터링하고 관리를 자동화합니다. 자세히 알아보기', ['목록 보기']],
  ['Chrome에서 사용자 작업 제어', 'ChromeOS 작업 규칙을 사용하여 민감한 콘텐츠가 노출될 수 있는 사용자 작업을 관리합니다. 자세히 알아보기', ['목록 보기', '규칙 만들기']],
];

/* [이름, 설명, 상태, 알림] — 시스템 정의 규칙 26개 */
const SYSTEM_RULES = [
  ['TLS 실패', '전송 레이어 보안(TLS)이 필요한 메일은 전송할 수 없습니다.', '활동 안함', '–'],
  ['Smarthost 실패', '대량의 메일을 사용자의 스마트 호스트 서버 중 하나에 전송할 수 없는 경우 알림이 표시됩니다.', '활동 안함', '–'],
  ['한도 초과된 수신자', '이메일 수신율이 높으면 악성 공격의 가능성 또는 설정에 구성 오류가 있다는 의미일 수 있습니다.', '활동 안함', '–'],
  ['Exchange 업무 일지 작성 실패', 'Microsoft® Exchange 서버 사용자가 생성한 이메일 트래픽을 Google Vault에 제대로 보관처리되는지 확인하는 Exchange 저널링에 오류가 있습니다.', '활동 안함', '–'],
  ['앱 장애 알림', '앱 중단이 새로 발생, 업데이트 또는 해결되는 경우 Google Workspace 상태 대시보드에 표시되는 알림입니다.', '활동 안함', '사용 중지'],
  ['Vault 빠른 삭제가 시작됨', 'Vault 관리자가 빠른 삭제 요청을 시작했습니다.', '활성', '사용'],
  ['사용자가 신고한 피싱', '발신자가 도메인으로 보낸 메일을 사용자가 피싱으로 분류했습니다.', '활성', '사용'],
  ['사용자 비밀번호 변경됨', '사용자의 비밀번호가 변경되었습니다.', '활동 안함', '사용 중지'],
  ['사용자의 관리자 권한 취소됨', '사용자의 관리자 권한이 취소되었습니다.', '활동 안함', '사용 중지'],
  ['릴레이 스팸 발송으로 사용자 일시정지됨', 'Google에서 SMTP 릴레이 서비스를 통해 스팸과 같은 의심스러운 활동을 감지하여 계정을 사용중지했습니다.', '활성', '사용'],
  ['스팸 발송 사용자 일시정지됨', 'Google에서 스팸과 같은 의심스러운 활동을 감지하여 계정을 사용중지했습니다.', '활성', '사용'],
  ['의심스러운 활동으로 사용자 일시정지됨', 'Google에서 도용의 가능성을 감지하여 사용자의 계정이 사용중지되었습니다.', '활성', '사용'],
  ['사용자 사용중지됨(Google ID 알림)', 'Google에서 의심스러운 활동을 감지하여 계정을 사용중지했습니다.', '활성', '사용'],
  ['관리자가 정지한 사용자', '관리자가 계정을 정지했습니다.', '활동 안함', '사용 중지'],
  ['사용자에게 관리자 권한 부여', '사용자에게 관리자 권한이 부여되었습니다.', '활동 안함', '사용 중지'],
  ['사용자 삭제됨', '도메인에서 사용자가 삭제되었습니다.', '활동 안함', '사용 중지'],
  ['프로그램 방식으로 발생한 의심스러운 로그인', 'Google에서 애플리케이션 또는 컴퓨터 프로그램에서 의심스러운 로그인 시도를 감지했습니다.', '활성', '사용'],
  ['의심스러운 메일이 보고됨', '발신자가 도메인으로 보낸 메일을 사용자가 스팸으로 분류했습니다.', '활성', '사용'],
  ['의심스러운 로그인', 'Google에서 사용자의 일상적인 행동과 일치하지 않는 로그인 시도(예: 엉뚱한 위치에서 로그인)를 감지했습니다.', '활성', '사용'],
  ['의심스러운 기기 활동', '기기 ID, 일련번호, 기기 유형 또는 기기 제조업체 등의 기기 속성이 업데이트되면 세부정보를 제공합니다.', '활성', '사용'],
  ['사용중지된 사용자 활성화됨', '사용중지된 사용자가 활성화되었습니다.', '활동 안함', '사용 중지'],
  ['SSO 프로필이 업데이트됨', '사용자가 서드 파티 ID 공급업체를 통해 Google 서비스에 로그인하도록 허용하는 SSO 프로필에 변경사항이 있으면 알림을 보내드립니다.', '활성', '사용'],
  ['SSO 프로필이 삭제됨', '사용자가 더 이상 서드 파티 ID 공급업체를 통해 Google 서비스에 로그인할 수 없게 되면 알림을 보내드립니다.', '활성', '사용'],
  ['SSO 프로필이 추가됨', '새로운 SSO 프로필로 사용자가 서드 파티 ID 공급업체를 통해 Google 서비스에 로그인할 수 있게 되면 알림을 보내드립니다.', '활성', '사용'],
  ['사용자가 신고한 스팸 급증', '발신자가 보낸 비정상적으로 많은 양의 메일을 사용자가 스팸으로 표시했습니다.', '활성', '사용'],
  ['기본 관리자 변경됨', '기본 관리자가 변경되면 알림을 보내드립니다. 이 관리자는 Google에서 청구 및 기타 계정 관련 알림을 받게 됩니다.', '활성', '사용'],
];

const rules = {
  '*': {
    render(ctx) {
      // '규칙 만들기'(data-add) 양식 등록 — 목록 자체는 아래 표에서 시스템 규칙과 합쳐 그린다.
      ctx.defineList('admin-rules', {
        title: '규칙',
        addLabel: '규칙 만들기',
        fields: [
          { name: 'name', label: '규칙 이름', required: true, placeholder: '예: 기기 미준수 알림' },
          { name: 'scope', label: '범위', type: 'select', options: ['전체', '기기', 'Drive', 'Gmail', '관리자 활동', '보고서'] },
          { name: 'action', label: '작업', type: 'select', options: ['알림 보내기', '이메일 알림', '작업 차단', '보고서 생성'] },
          { name: 'status', label: '상태', type: 'select', options: ['활성', '활동 안함'] },
        ],
      });
      const userRules = ctx.collection('admin-rules');
      const onCls = (v) => (v === '활성' || v === '사용' ? 'status-on' : '');
      const stateCell = (name, value) => ctx.editable({
        scope: 'rules', name: `${name} · 상태`, value, options: ['활성', '활동 안함'], section: '규칙',
        className: onCls(ctx.setting('rules', `${name} · 상태`, value)),
      });
      const alertCell = (name, value) => ctx.editable({
        scope: 'rules', name: `${name} · 알림`, value, options: ['사용', '사용 중지', '–'], section: '규칙',
        className: onCls(ctx.setting('rules', `${name} · 알림`, value)),
      });
      const sectionRow = (label) => `<tr><td colspan="7" style="background:#f8f9fa;font-weight:500">${ctx.esc(label)}</td></tr>`;

      const cards = RULE_CARDS.map(([title, desc, links]) => `<article class="ext-card">
        <h2>${ctx.esc(title)}</h2>
        <p style="color:#5f6368;font-size:13px;line-height:1.5;margin:8px 0 12px">${ctx.esc(desc)}</p>
        <div>${links.map((l) => (l === '규칙 만들기'
          ? `<button class="link-btn" data-add="admin-rules">${ctx.esc(l)}</button>`
          : `<button class="link-btn" data-toast="${ctx.esc(l)}">${ctx.esc(l)}</button>`)).join(' · ')}</div>
      </article>`).join('');

      const userRows = userRules.map((r) => `<tr>
        <td><b class="blue-text">${ctx.esc(r.name || '—')}</b><small class="muted-id">${ctx.esc(r.scope ? `사용자 정의 규칙 · ${r.scope}` : '사용자 정의 규칙')}</small></td>
        <td>${stateCell(r.name || r.id, r.status || '활성')}</td>
        <td>사용자 정의</td>
        <td>–</td>
        <td>${ctx.esc(r.action || '알림 보내기')}</td>
        <td>${alertCell(r.name || r.id, '사용')}</td>
        <td class="col-actions"><button class="row-action danger" data-action="delete-record" data-key="admin-rules" data-id="${ctx.esc(r.id)}" title="삭제">${ctx.icon('delete', 18)}</button></td>
      </tr>`).join('');

      const sysRows = SYSTEM_RULES.map(([name, desc, status, alert]) => `<tr>
        <td><b class="blue-text">${ctx.esc(name)}</b><small class="muted-id">${ctx.esc(desc)}</small></td>
        <td>${stateCell(name, status)}</td>
        <td>시스템 정의됨</td>
        <td>–</td>
        <td>알림 보내기</td>
        <td>${alertCell(name, alert)}</td>
        <td class="col-actions"></td>
      </tr>`).join('');

      const total = userRules.length + SYSTEM_RULES.length;
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('규칙')}
        <div class="page-title-row">
          <div><h1>규칙</h1><p class="page-desc">알림과 자동 작업을 규칙으로 관리합니다.</p></div>
          <button class="primary-button" data-add="admin-rules">${ctx.icon('add', 18)} 규칙 만들기</button>
        </div>
        <div class="ext-dir-cards">${cards}</div>
        <div class="data-panel flat list-panel" style="margin-top:16px">
          <div class="action-strip">
            <strong>규칙 | ${total}개 표시</strong>
            <button data-add="admin-rules">규칙 만들기 ${ctx.icon('arrow_drop_down', 16)}</button>
            <button data-toast="템플릿">템플릿</button>
            <button data-toast="조사">조사</button>
            <button data-toast="다운로드">다운로드</button>
          </div>
          <div class="filter-strip"><button data-toast="필터 추가">${ctx.icon('add', 17)} 필터 추가</button></div>
          <div class="table-wrap"><table class="admin-table">
            <thead><tr><th>이름</th><th>상태</th><th>규칙 유형</th><th>앱</th><th>작업</th><th>알림</th><th class="col-actions"></th></tr></thead>
            <tbody>
              ${userRules.length ? sectionRow('사용자 정의 규칙') + userRows : ''}
              ${sectionRow('시스템 정의 규칙')}
              ${sysRows}
            </tbody>
          </table></div>
          <div class="table-footer"><span>페이지당 행 수: 50</span><span>1-${total} / ${total}</span></div>
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

function accountTablePage(ctx, { crumb, title, desc, columns, rows, note = '' }) {
  return `<div class="section-page wide admin-page">
    ${ctx.crumb(crumb)}
    <h1>${ctx.esc(title)}</h1>
    ${desc ? `<p class="page-desc">${ctx.esc(desc)}</p>` : ''}
    <div class="data-panel flat">
      <table class="admin-table">
        <thead><tr>${columns.map((c) => `<th>${ctx.esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td>${i === 0 ? `<b class="blue-text">${ctx.esc(v)}</b>` : ctx.esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    ${note ? `<p class="page-desc">${ctx.esc(note)}</p>` : ''}
  </div>`;
}

const account = {
  '계정 설정': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('계정 > 계정 설정')}
        <h1>계정 설정</h1>
        <p class="page-desc">조직 프로필, 환경설정, 맞춤설정을 관리합니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '프로필', '조직 이름과 기본 관리자 정보입니다.', [['이름', '연습학교'], ['고객 ID', 'C00practice'], ['기본 관리자', 'admin@practice.senedu.kr']], false)}
          ${settingsCard(ctx, '환경설정', '새 기능과 제품의 출시 방식을 선택합니다.', [['새로운 사용자 기능', '빠른 출시', ['빠른 출시', '예약 출시']], ['새 제품', '자동 배포', ['자동 배포', '수동 배포']], ['이메일 옵션', '도움말 및 업데이트, 기능 알림 수신']], false)}
          ${settingsCard(ctx, 'Google Workspace의 스마트 기능', '스마트 기능의 기본 설정 사용 여부를 선택합니다.', [['기본 설정', '사용 설정됨', ['사용 설정됨', '사용 중지됨']]], false)}
          ${settingsCard(ctx, '계정 관리', '계정을 삭제하면 모든 사용자 계정, 데이터, 서비스에 대한 액세스 권한이 완전히 삭제됩니다.', [], false)}
          ${settingsCard(ctx, '맞춤설정', '로그인 화면 등에 표시할 조직 로고를 설정합니다.', [['로고', '설정되지 않음']], false)}
          ${settingsCard(ctx, '중복 계정 관리', '중복되는 비관리 계정을 관리 계정으로 대체합니다.', [['처리 방식', '사용자에게 계정 이전 요청', ['사용자에게 계정 이전 요청', '자동으로 임시 계정 생성']]], false)}
        </div>
      </div>`;
    },
  },
  '관리자 역할': {
    render: (ctx) => accountTablePage(ctx, {
      crumb: '계정 > 관리자 역할', title: '관리자 역할',
      desc: '역할별 권한과 배정된 관리자를 확인합니다.',
      columns: ['역할', '설명', '관리자 수'],
      rows: [
        ['최고 관리자', '관리 콘솔의 모든 기능에 액세스', '1'],
        ['학교 관리자(센스쿨)', '학교 단위 사용자·기기 관리', '1'],
        ['그룹 관리자', '그룹 생성 및 멤버십 관리', '0'],
        ['도움말 데스크 관리자', '비밀번호 재설정 지원', '0'],
      ],
    }),
  },
  '도메인/개요': {
    render(ctx) {
      return `<div class="section-page wide admin-page">
        ${ctx.crumb('계정 > 도메인 > 개요')}
        <h1>도메인 개요</h1>
        <p class="page-desc">조직에 연결된 도메인 현황입니다.</p>
        <div class="settings-cards">
          ${settingsCard(ctx, '기본 도메인', '사용자 이메일 주소에 사용되는 도메인입니다.', [['도메인', 'practice.senedu.kr'], ['상태', '확인됨']], false)}
          ${settingsCard(ctx, '보조 도메인', '추가로 연결된 도메인입니다.', [['보조 도메인', '없음']], false)}
        </div>
      </div>`;
    },
  },
  '도메인/도메인 관리': {
    render: (ctx) => accountTablePage(ctx, {
      crumb: '계정 > 도메인 > 도메인 관리', title: '도메인 관리',
      desc: '도메인을 추가하거나 소유권을 확인합니다.',
      columns: ['도메인', '유형', '상태', 'Gmail 사용'],
      rows: [['practice.senedu.kr', '기본 도메인', '확인됨', '사용']],
      note: '연습용 시뮬레이터에서는 도메인 추가가 실제로 진행되지 않습니다.',
    }),
  },
  '도메인/허용된 도메인': {
    render: (ctx) => accountTablePage(ctx, {
      crumb: '계정 > 도메인 > 허용된 도메인', title: '허용된 도메인',
      desc: '드라이브 공유 등에서 신뢰하는 외부 도메인 목록입니다.',
      columns: ['도메인', '용도', '추가일'],
      rows: [['sen.go.kr', '교육청 공유', '2026-03-02']],
    }),
  },
  '리셀러 관리': {
    render: (ctx) => accountTablePage(ctx, {
      crumb: '계정 > 리셀러 관리', title: '리셀러 관리',
      desc: '조직의 Google Workspace 리셀러 정보를 확인합니다.',
      columns: ['리셀러', '역할', '상태'],
      rows: [['연결된 리셀러 없음', '—', '—']],
    }),
  },
};
account['*'] = account['계정 설정'];

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
  '액세스 및 데이터 관리/API 관리': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > API 제어', title: 'API 제어',
      desc: '서드 파티 앱이 학교 계정 데이터에 접근하는 방식을 관리합니다.',
      cards: [
        ['앱 액세스 제어', '신뢰할 수 있는 앱 목록을 관리합니다.', [['신뢰할 수 있는 앱', '12개'], ['차단된 앱', '0개'], ['기본 정책', '관리자 승인 필요']]],
        ['도메인 소유 앱', '학교가 만든 내부 앱은 자동으로 신뢰합니다.', [['상태', '신뢰함']]],
      ],
    }),
  },
  '액세스 및 데이터 관리/덜 안전한 앱': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > 덜 안전한 앱', title: '덜 안전한 앱',
      desc: '최신 보안 표준(OAuth)을 사용하지 않는 앱의 접근을 제어합니다.',
      cards: [['액세스 허용 여부', '덜 안전한 앱의 로그인 허용 여부입니다.', [['상태', '모든 사용자에 대해 사용 중지'], ['적용 대상', '연습학교']]]],
    }),
  },
  '액세스 및 데이터 관리/컨텍스트 인식 액세스': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > 컨텍스트 인식 액세스', title: '컨텍스트 인식 액세스',
      desc: '기기 상태·위치·IP에 따라 접근을 허용하거나 차단합니다.',
      cards: [['액세스 수준', '정의된 접근 조건입니다.', [['만든 수준', '0개'], ['적용된 앱', '없음']]]],
    }),
  },
  '액세스 및 데이터 관리/데이터 보호': {
    render: (ctx) => cardPage(ctx, {
      crumb: '보안 > 액세스 및 데이터 관리 > 데이터 보호', title: '데이터 보호',
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
    render: (ctx) => ctx.listPage({
      key: 'investigations',
      title: '조사 도구', breadcrumb: '보안 > 보안 센터',
      description: '로그 이벤트를 검색해 보안 사고를 조사합니다. (최고 관리자 전용)',
      addLabel: '새 조사',
      emptyTitle: '저장된 검색이 없습니다',
      columns: [
        { key: 'name', label: '저장된 검색' },
        { key: 'source', label: '데이터 소스', editable: true, options: ['Drive 로그 이벤트', 'Gmail 로그 이벤트', '사용자 로그 이벤트', '기기 로그 이벤트', '관리자 로그 이벤트'] },
        { key: 'owner', label: '만든 사람' },
        { key: 'modified', label: '수정일' },
      ],
      fields: [
        { name: 'name', label: '저장된 검색 이름', required: true, placeholder: '예: 외부 공유 문서 조회' },
        { name: 'source', label: '데이터 소스', type: 'select', options: ['Drive 로그 이벤트', 'Gmail 로그 이벤트', '사용자 로그 이벤트', '기기 로그 이벤트', '관리자 로그 이벤트'] },
        { name: 'owner', label: '만든 사람', placeholder: '예: admin@practice.senedu.kr' },
        { name: 'modified', label: '수정일', type: 'date' },
      ],
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
    render: (ctx) => ctx.listPage({
      key: 'data-exports',
      title: '데이터 내보내기', breadcrumb: '데이터 > 데이터 가져오기 및 내보내기',
      description: '조직 데이터를 내보낸 기록입니다. 내보내기는 최고 관리자만 실행할 수 있습니다.',
      addLabel: '새 내보내기',
      emptyTitle: '아직 가져오기·내보내기 기록이 없습니다',
      columns: [
        { key: 'job', label: '작업' },
        { key: 'requester', label: '요청자' },
        { key: 'date', label: '요청일' },
        { key: 'status', label: '상태', editable: true, options: ['진행 중', '완료', '실패'] },
      ],
      fields: [
        { name: 'job', label: '작업 이름', required: true, placeholder: '예: 사용자 목록 내보내기' },
        { name: 'requester', label: '요청자', placeholder: '예: admin@practice.senedu.kr' },
        { name: 'date', label: '요청일', type: 'date' },
        { name: 'status', label: '상태', type: 'select', options: ['진행 중', '완료', '실패'] },
      ],
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
