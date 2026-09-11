// 사이드바 구성 — sen: 센스쿨(학교 관리자) 권한에서도 보이는 메뉴, senLinks: 센스쿨에서 보이는 하위 메뉴
export const SECTIONS = [
  {
    id: 'home', title: '홈', icon: 'home', sen: true, links: [], noChevron: true,
  },
  {
    id: 'directory', title: '디렉터리', icon: 'account_box', sen: true,
    subtitle: '사용자, 그룹, 조직 단위 관리',
    links: ['사용자', '그룹', '공유 대상 그룹', '조직 단위', '건물 및 리소스', '디렉터리 설정', '외부 디렉터리'],
    senLinks: ['사용자', '그룹', '조직 단위', '건물 및 리소스', '디렉터리 설정'],
  },
  {
    id: 'devices', title: '기기', icon: 'devices', sen: true,
    subtitle: '모바일·엔드포인트·ChromeOS 기기 관리',
    links: ['개요', '모바일 및 엔드포인트', 'ChromeOS', 'Chrome', '네트워크'],
    senLinks: ['개요', '모바일 및 엔드포인트', 'ChromeOS', 'Chrome'],
  },
  {
    id: 'chrome', title: 'Chrome 브라우저', icon: 'language', sen: false, blueDot: true,
    subtitle: '브라우저 정책과 확장 프로그램 관리',
    links: ['개요', '설정 가이드', '관리 브라우저', '관리 프로필', '설정', '커스텀 구성', '토큰', '앱 및 확장 프로그램', '커넥터', '보고서'],
  },
  {
    id: 'apps', title: '앱', icon: 'apps', sen: false,
    subtitle: 'Google Workspace 및 웹 앱 설정',
    links: ['개요', 'Google Workspace', '추가 Google 서비스', '웹 및 모바일 앱', 'Google Workspace Marketplace 앱', 'LDAP'],
  },
  {
    id: 'ai', title: '생성형 AI', icon: 'auto_awesome', sen: false,
    subtitle: 'AI 기능의 접근 및 데이터 설정',
    links: ['Gemini 앱', 'Gemini Enterprise', 'Workspace의 Gemini', 'Gemini Notebook', 'Gemini 보고서'],
  },
  {
    id: 'agents', title: '에이전트', icon: 'smart_toy', sen: false, badge: '새로운 기능',
    subtitle: '교육용 자동화 기능 둘러보기',
    links: ['에이전트 개요', '활동', '설정'],
  },
  {
    id: 'security', title: '보안', icon: 'verified_user', sen: true,
    subtitle: '인증, 알림, 조사 도구',
    links: ['개요', '보안 센터', '인증', '액세스 및 데이터 제어', '경고 센터'],
    senLinks: ['개요', '인증', '액세스 및 데이터 제어'],
  },
  {
    id: 'data', title: '데이터', icon: 'folder_open', sen: true,
    subtitle: '이전, 가져오기, 내보내기 설정',
    links: ['데이터 이전', '가져오기 및 내보내기', '데이터 리전'],
    senLinks: ['데이터 이전', '가져오기 및 내보내기'],
  },
  {
    id: 'reports', title: '보고', icon: 'assessment', sen: false,
    subtitle: '사용자 및 관리자 활동 모니터링',
    links: ['보고서', '감사 및 조사', '앱 보고서'],
  },
  {
    id: 'billing', title: '결제', icon: 'credit_card', sen: false,
    subtitle: '구독 및 결제 계정 살펴보기',
    links: ['구독', '결제 계정', '라이선스'],
  },
  {
    id: 'account', title: '계정', icon: 'settings', sen: false,
    subtitle: '조직 프로필과 환경설정 관리',
    links: ['계정 설정', '프로필', '맞춤 URL', '법률 및 규정 준수'],
  },
  {
    id: 'rules', title: '규칙', icon: 'policy', sen: true, noChevron: true,
    subtitle: '알림 및 자동 작업 규칙 설정',
    links: [],
  },
  {
    id: 'storage', title: '저장용량', icon: 'cloud', sen: false,
    subtitle: '조직의 공유 저장용량 관리',
    links: ['개요', '저장용량 관리 도구', '사용자별 저장용량'],
  },
];

/** 현재 모드에서 보이는 섹션 목록 */
export function visibleSections(mode) {
  return mode === 'full' ? SECTIONS : SECTIONS.filter((s) => s.sen);
}

/** 현재 모드에서 해당 섹션의 하위 메뉴 */
export function visibleLinks(section, mode) {
  if (mode === 'full') return section.links;
  return section.senLinks || section.links;
}

export function findSection(id) {
  return SECTIONS.find((s) => s.id === id);
}

/** 센스쿨 모드에서 막히는 메뉴인지 */
export function isRestricted(sectionId, link, mode) {
  if (mode === 'full') return false;
  const section = findSection(sectionId);
  if (!section) return true;
  if (!section.sen) return true;
  if (link && !visibleLinks(section, mode).includes(link)) return true;
  return false;
}
