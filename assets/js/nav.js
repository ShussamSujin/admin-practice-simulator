// 사이드바 구성
//  - links: 문자열(바로 열리는 메뉴) 또는 { name, children:[...] }(펼쳐지는 메뉴군)
//  - sen:false 가 붙은 섹션/메뉴는 센스쿨(학교 관리자) 모드에서 숨겨집니다.
//  - 경로는 '/'로 이어붙인 문자열입니다. 예) 'Chrome/설정', 'Chrome/보고서/기기 보고서'

export const SECTIONS = [
  { id: 'home', title: '홈', icon: 'home', sen: true, links: [] },

  {
    id: 'directory', title: '디렉터리', icon: 'person', sen: true,
    subtitle: '사용자, 그룹, 조직 단위 관리',
    links: [
      '사용자',
      '그룹',
      { name: '공유 대상 그룹', sen: false },
      '조직 단위',
      { name: '건물 및 리소스', children: ['개요', '리소스 관리', '회의실 통계', '회의실 설정'] },
      '디렉터리 설정',
      { name: '외부 디렉터리', sen: false },
    ],
  },

  {
    id: 'devices', title: '기기', icon: 'devices', sen: true,
    subtitle: '모바일·엔드포인트·ChromeOS 기기 관리',
    links: [
      '개요',
      {
        name: 'Chrome',
        children: [
          '설정 가이드', '기기', '등록 토큰', '관리 브라우저', '설정',
          '앱 및 확장 프로그램', '웹 기능', '커넥터', '프린터',
          { name: '보고서', children: ['기기 보고서', '앱 및 확장 프로그램 사용량', '버전 보고서'] },
        ],
      },
      {
        name: '모바일 및 엔드포인트',
        children: [
          '기기', '회사 소유 인벤토리', '기기 승인',
          { name: '설정', children: ['Android', 'iOS', 'Windows', '범용', '등록', '타사 통합'] },
          '앱', '보고서', '감사', '보고서 규칙 관리', '규칙',
        ],
      },
      { name: '네트워크', sen: false },
    ],
  },

  {
    id: 'agents', title: '에이전트', icon: 'smart_toy', sen: false, badge: '새로운 기능',
    subtitle: '교육용 자동화 기능 둘러보기',
    links: ['에이전트 액세스 관리', '설정'],
  },

  {
    id: 'chrome', title: 'Chrome 브라우저', icon: 'language', sen: false, blueDot: true,
    subtitle: '브라우저 정책과 확장 프로그램 관리',
    links: [
      '개요', '설정 가이드', '관리 브라우저', '관리 프로필', '설정', '커스텀 구성', '토큰', '앱 및 확장 프로그램', '커넥터',
      {
        name: '보고서',
        children: ['개요', '기기', '버전', '앱 및 확장 프로그램 사용', 'Android 앱 설치', '통계', '프린터', 'Chrome 로그 이벤트', 'ChromeOS 비정상 종료'],
      },
    ],
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
    id: 'security', title: '보안', icon: 'shield', sen: true,
    subtitle: '인증, 알림, 조사 도구',
    links: [
      '개요',
      '알림 센터',
      { name: '보안 센터', sen: false, children: ['대시보드', '조사 도구', '상태 점검'] },
      {
        name: '인증',
        children: [
          '2단계 인증', '계정 복구', '고급 보호 프로그램', '본인 확인 요청', '패스워드리스',
          '비밀번호 관리', 'SAML 애플리케이션을 통한 SSO', '타사 IdP를 통한 SSO',
          '복수 사용자 승인 체계 요청', '복수 사용자 승인 체계 설정',
        ],
      },
      {
        name: '액세스 및 데이터 관리',
        children: ['API 관리', '컨텍스트 인식 액세스', '데이터 분류', '라벨 관리자', '데이터 보호', 'Google 세션 제어', 'Google Cloud 세션 관리'],
      },
    ],
  },

  {
    id: 'data', title: '데이터', icon: 'folder_special', sen: true,
    subtitle: '이전, 가져오기, 내보내기 설정',
    links: [
      { name: '데이터 가져오기 및 내보내기', children: ['데이터 이전', '데이터 내보내기'] },
      { name: '규정 준수', sen: false, children: ['데이터 리전'] },
    ],
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
    links: [
      '계정 설정',
      '관리자 역할',
      { name: '도메인', children: ['개요', '도메인 관리', '허용된 도메인'] },
      '리셀러 관리',
    ],
  },

  { id: 'rules', title: '규칙', icon: 'policy', sen: true, subtitle: '알림 및 자동 작업 규칙 설정', links: [] },

  {
    id: 'storage', title: '저장용량', icon: 'cloud', sen: false,
    subtitle: '조직의 공유 저장용량 관리',
    links: ['개요', '저장용량 관리 도구', '사용자별 저장용량'],
  },
];

const isVisible = (node, mode) => mode === 'full' || node.sen !== false;

/** 링크 노드를 { name, path, children } 형태로 정규화 */
function normalize(node, parentPath, mode) {
  const name = typeof node === 'string' ? node : node.name;
  const path = parentPath ? `${parentPath}/${name}` : name;
  const children = (typeof node === 'string' ? [] : node.children || [])
    .filter((child) => isVisible(typeof child === 'string' ? {} : child, mode))
    .map((child) => normalize(child, path, mode));
  return { name, path, children };
}

export function visibleSections(mode) {
  return mode === 'full' ? SECTIONS : SECTIONS.filter((s) => s.sen);
}

/** 현재 모드에서 보이는 하위 메뉴 트리 */
export function navTree(section, mode) {
  return (section.links || [])
    .filter((node) => isVisible(typeof node === 'string' ? {} : node, mode))
    .map((node) => normalize(node, '', mode));
}

/** 트리의 모든 경로를 순서대로 펼친 목록 */
export function flatPaths(section, mode) {
  const out = [];
  const walk = (nodes) => nodes.forEach((n) => { out.push(n.path); walk(n.children); });
  walk(navTree(section, mode));
  return out;
}

/** 섹션을 열었을 때 기본으로 보여줄 경로(첫 번째 잎) */
export function firstLeaf(section, mode) {
  const walk = (nodes) => {
    for (const n of nodes) {
      if (!n.children.length) return n.path;
      const deeper = walk(n.children);
      if (deeper) return deeper;
    }
    return '';
  };
  return walk(navTree(section, mode));
}

export function findSection(id) {
  return SECTIONS.find((s) => s.id === id);
}

/** 센스쿨 모드에서 막히는 메뉴인지 */
export function isRestricted(sectionId, path, mode) {
  if (mode === 'full') return false;
  const section = findSection(sectionId);
  if (!section) return true;
  if (!section.sen) return true;
  if (!path) return false;
  return !flatPaths(section, mode).includes(path);
}

/** 경로의 마지막 조각 */
export function leafOf(path) {
  return String(path || '').split('/').pop();
}
