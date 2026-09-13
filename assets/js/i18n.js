// 한국어 → 영어 표시 번역 사전.
// 렌더된 화면의 텍스트 노드를 그대로 치환하므로, 라우팅 키(data-nav 등)는 한국어를 유지한다.
export const EN = {
  // ---- 상단바 ----
  '사용자, 그룹, 설정 또는 기기 검색': 'Search for users, groups, settings, or devices',
  '센스쿨': 'SEN School',
  '최고관리자': 'Super Admin',
  '도움말': 'Help',
  '작업': 'Tasks',
  'Google 앱': 'Google apps',
  '기본 메뉴': 'Main menu',

  // ---- 로그인 ----
  '계정 선택': 'Choose an account',
  '계속하려면 ': 'to continue to ',
  '관리 콘솔': 'Admin console',
  '로 이동할 계정을 선택하세요.': ' — select an account.',
  '연습학교 관리자': 'Practice School Admin',
  '센스쿨(SEN) 학교 관리자 — 권한 일부 제한': 'SEN school admin — limited privileges',
  '최고 관리자': 'Super administrator',
  '모든 메뉴 사용 가능 — 비교용': 'All menus available — for comparison',
  '연습용 시뮬레이터입니다. 입력한 내용은 이 브라우저에만 저장되며 실제 조직 설정은 절대 변경되지 않습니다.':
    'This is a practice simulator. Everything you enter is stored only in this browser and never changes any real organization.',
  'practice.senedu.kr · 연습 전용': 'practice.senedu.kr · practice only',
  '문의: gajungssamzzang@gmail.com': 'Contact: gajungssamzzang@gmail.com',
  '비공식 교육용 시뮬레이터 · Google LLC와 제휴하거나 Google이 승인한 서비스가 아닙니다.':
    'Unofficial training simulator. Not affiliated with, endorsed, or sponsored by Google LLC.',

  // ---- 사이드바 섹션 ----
  '홈': 'Home', '디렉터리': 'Directory', '기기': 'Devices', 'Chrome 브라우저': 'Chrome browser',
  '앱': 'Apps', '생성형 AI': 'Generative AI', '에이전트': 'Agents', '보안': 'Security',
  '데이터': 'Data', '보고': 'Reporting', '결제': 'Billing', '계정': 'Account', '규칙': 'Rules',
  '저장용량': 'Storage', '새로운 기능': 'NEW', '의견 보내기': 'Send feedback',
  '서비스 약관': 'Terms of Service', '결제 조건': 'Billing Terms', '개인정보처리방침': 'Privacy Policy',
  '연수용 시뮬레이터 · © Google Certified Trainer & Innovator Sujin Lee · ': 'Training simulator · © Google Certified Trainer & Innovator Sujin Lee · ',

  // ---- 사이드바 하위 메뉴 ----
  '사용자': 'Users', '그룹': 'Groups', '공유 대상 그룹': 'Target audiences', '조직 단위': 'Organizational units',
  '건물 및 리소스': 'Buildings and resources', '디렉터리 설정': 'Directory settings', '외부 디렉터리': 'External directories',
  '개요': 'Overview', '리소스 관리': 'Manage resources', '회의실 통계': 'Room insights', '회의실 설정': 'Room settings',
  '설정 가이드': 'Setup guide', '등록 토큰': 'Enrollment tokens', '관리 브라우저': 'Managed browsers',
  '설정': 'Settings', '앱 및 확장 프로그램': 'Apps & extensions', '웹 기능': 'Web features', '커넥터': 'Connectors',
  '프린터': 'Printers', '보고서': 'Reports', '기기 보고서': 'Device reports',
  '앱 및 확장 프로그램 사용량': 'Apps & extensions usage', '버전 보고서': 'Version report',
  '모바일 및 엔드포인트': 'Mobile & endpoints', '회사 소유 인벤토리': 'Company-owned inventory',
  '기기 승인': 'Device approvals', '범용': 'Universal', '등록': 'Enrollment', '타사 통합': 'Third-party integrations',
  '감사': 'Audit', '보고서 규칙 관리': 'Manage reporting rules', '네트워크': 'Networks',
  '관리 프로필': 'Managed profiles', '커스텀 구성': 'Custom configurations', '토큰': 'Tokens',
  'Google Workspace Marketplace 앱': 'Google Workspace Marketplace apps', '추가 Google 서비스': 'Additional Google services',
  '웹 및 모바일 앱': 'Web and mobile apps',
  'Gemini 앱': 'Gemini app', 'Workspace의 Gemini': 'Gemini for Workspace', 'Gemini 보고서': 'Gemini reports',
  '에이전트 액세스 관리': 'Manage agent access',
  '알림 센터': 'Alert center', '보안 센터': 'Security center', '대시보드': 'Dashboard', '조사 도구': 'Investigation tool',
  '상태 점검': 'Health check', '인증': 'Authentication', '2단계 인증': '2-step verification', '계정 복구': 'Account recovery',
  '고급 보호 프로그램': 'Advanced Protection Program', '본인 확인 요청': 'Verify user requests', '패스워드리스': 'Passwordless',
  '비밀번호 관리': 'Password management', 'SAML 애플리케이션을 통한 SSO': 'SSO with SAML applications',
  '타사 IdP를 통한 SSO': 'SSO with third-party IdP', '복수 사용자 승인 체계 요청': 'Multi-party approval requests',
  '복수 사용자 승인 체계 설정': 'Multi-party approval settings', '액세스 및 데이터 관리': 'Access and data control',
  'API 관리': 'API controls', '컨텍스트 인식 액세스': 'Context-Aware Access', '데이터 분류': 'Data classification',
  '라벨 관리자': 'Label manager', '데이터 보호': 'Data protection', 'Google 세션 제어': 'Google session control',
  'Google Cloud 세션 관리': 'Google Cloud session control',
  '데이터 가져오기 및 내보내기': 'Data import & export', '데이터 이전': 'Data migration', '데이터 내보내기': 'Data export',
  '규정 준수': 'Compliance', '데이터 리전': 'Data regions',
  '감사 및 조사': 'Audit and investigation', '앱 보고서': 'Apps reports',
  '구독': 'Subscriptions', '결제 계정': 'Payment accounts', '라이선스': 'Licenses',
  '계정 설정': 'Account settings', '프로필': 'Profile', '맞춤 URL': 'Custom URLs', '법률 및 규정 준수': 'Legal and compliance',
  '저장용량 관리 도구': 'Storage management tools', '사용자별 저장용량': 'Storage by user',

  // ---- 홈 ----
  '관리 콘솔 홈': 'Admin console home',
  '연습학교': 'Practice School',
  '연습용 시뮬레이터입니다.': 'This is a practice simulator.',
  '눌러 보는 모든 설정은 이 브라우저에만 저장되고 실제 조직에는 반영되지 않습니다.':
    'Every setting you change is stored only in this browser and never affects a real organization.',
  '센스쿨 학교 관리자에게 위임되지 않은 메뉴는 표시되지 않습니다.':
    'Menus not delegated to SEN school admins are hidden.',
  '최고관리자 권한과 비교하기': 'Compare with Super Admin',
  '센스쿨 권한으로 보기': 'View as SEN School admin',
  '연습 데이터 초기화': 'Reset practice data',
  '사용자 추가 또는 관리': 'Add or manage users',
  '모두 보기': 'SEE ALL',
  '사용자 추가': 'Add a user', '사용자 삭제': 'Delete a user',
  '사용자 이름 또는 이메일 업데이트': "Update a user's name or email",
  '사용자 비밀번호 재설정': "Reset a user's password", '그룹 만들기': 'Create a group',
  '앱 액세스 제어': 'App access control',
  '만 18세 미만으로 지정된 사용자가 요청한 앱 검토': 'Review apps requested by users designated under 18',
  '디스커버': 'Discover', 'Google을 최대한 활용해 보세요': 'Get the most out of Google',
  'Google Workspace 최대한 활용하기': 'Get the most out of Google Workspace',
  'Google Workspace의 가장 유용한 기능을 자세히 알아보고 모든 것이 제대로 설정되어 있는지 확인하세요.':
    'Learn about the most useful Google Workspace features and make sure everything is set up properly.',
  'Google Workspace 살펴보기': 'Explore Google Workspace',
  '제품 업데이트': 'Product updates', 'Workspace의 최신 소식': "What's new in Workspace",
  '기기 관리 및 조직의 데이터 보호': "Manage devices and protect your organization's data",
  '규칙 관리를 통해 알림 및 작업 설정': 'Set up alerts and actions with rules',
  '사용자를 정책 적용을 위한 단위로 구성': 'Organize users into units for policy application',
  '조직 단위 만들기': 'Create organizational unit',
  '지원': 'Support', '도움말 어시스턴트와 연결': 'Connect with the Help Assistant',
  'Google 지원팀에 문의': 'Contact Google Support',
  '보안 설정 구성, 알림 및 분석 보기': 'Configure security settings, view alerts and analytics',
  '정책 · 확장 프로그램 관리': 'Manage policies and extensions',
  'Gemini 앱 및 보고서 설정': 'Gemini app and report settings',
  'Workspace 및 웹 앱 서비스 설정': 'Workspace and web app service settings',
  '도구': 'Tools',
  'Google Workspace 상태 대시보드': 'Google Workspace status dashboard',
  'Google Meet 동영상 설정': 'Google Meet video settings',

  // ---- 계정 팝오버 / 초기화 ----
  '학교 관리자(센스쿨)': 'School admin (SEN)',
  '변경한 설정': 'Changed settings',
  '연습 내용은 ': 'Practice data is stored ',
  '이 브라우저에만': 'in this browser only',
  ' 저장됩니다. 다른 선생님 화면이나 실제 조직에는 영향이 없습니다.': ". It never affects other teachers' screens or any real organization.",
  '계정 선택으로': 'Back to account chooser',
  '연습 데이터를 초기화할까요?': 'Reset practice data?',
  '이 브라우저에 저장된 연습 내용만 지웁니다.': 'Only clears practice data stored in this browser.',
  '직접 만든 조직 단위·사용자·그룹과 바꾼 설정값이 모두 처음 상태로 돌아갑니다.':
    'Organizational units, users, groups, and settings you changed will all return to their initial state.',
  '다른 사람의 화면이나 실제 관리 콘솔에는 아무 영향이 없습니다.':
    "This has no effect on anyone else's screen or the real Admin console.",
  '초기화': 'Reset', '취소': 'Cancel', '저장': 'Save', '확인': 'OK', '닫기': 'Close',

  // ---- 공통 UI ----
  '추가': 'Add', '삭제': 'Delete', '수정': 'Edit', '다운로드': 'Download', '더보기': 'More',
  '필터 추가': 'Add a filter', '필터 검색 또는 추가': 'Search or add a filter', '필터 지우기': 'Clear filters', '필터': 'Filters',
  '이름': 'Name', '이메일': 'Email', '상태': 'Status', '설명': 'Description', '유형': 'Type',
  '새 사용자 추가': 'Add new user', '기기 추가': 'Add device', '앱 추가': 'Add app', '규칙 추가': 'Add rule',
  '항목 추가': 'Add item', '알림': 'Notifications', '검색': 'Search',
  '사용': 'On', '사용 안함': 'Off', '사용 설정됨': 'Enabled', '사용 중지됨': 'Disabled', '활성': 'Active', '활동 안함': 'Inactive',
  '연습 모드': 'PRACTICE MODE', '변경됨': 'changed', '클릭하여 변경': 'Click to change',
  '기본값으로 되돌리기': 'Revert to default', '적용 대상': 'Applies to', '구성': 'Configuration', '상속': 'Inherited from',
  '지원 플랫폼': 'Supported platforms', 'Google 기본값': 'Google default', '로컬 단위로 적용됨': 'Locally applied',
  '조직 단위 검색': 'Search organizational units', '브라우저': 'Browsers',
  '페이지당 행 수: 20': 'Rows per page: 20', '페이지당 행 수: 10': 'Rows per page: 10',
  "'연습학교'에 적용됨": "Applied at 'Practice School'",

  // ---- 권한 없음 ----
  '이 계정에는 권한이 없습니다': "You don't have permission",
  '통합 검색': 'UNIFIED SEARCH', '검색 결과': 'Search results', '일치하는 메뉴가 없습니다': 'No matching menus',

  // ---- 문서 모달 ----
  '연수용 시뮬레이터 안내 문서': 'Training simulator information document',
};

// 역방향(EN→KO) 사전 — 한국어로 되돌릴 때 index.html의 고정 요소를 복원하는 데 쓴다.
const KO = {};
for (const [ko, en] of Object.entries(EN)) {
  if (!(en in KO)) KO[en] = ko;
}

/** 범위(root) 안의 텍스트 노드·placeholder·title 을 사전으로 치환 (양방향) */
export function translateDom(root, lang) {
  if (!root) return;
  const dict = lang === 'en' ? EN : KO;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const hit = dict[trimmed];
    if (hit !== undefined) {
      node.nodeValue = raw.replace(trimmed, hit);
    }
  }
  root.querySelectorAll('[placeholder],[title],[aria-label]').forEach((el) => {
    ['placeholder', 'title', 'aria-label'].forEach((attr) => {
      const v = el.getAttribute(attr);
      if (v && dict[v] !== undefined) el.setAttribute(attr, dict[v]);
    });
  });
}
