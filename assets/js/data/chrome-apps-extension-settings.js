/** Chrome 앱 및 확장 프로그램 > 설정 catalog (practice data for 연습학교 / practice.senedu.kr). */
export const chromeAppsExtensionSettingsCategories = [
  {
    title: '허용/차단 모드',
    items: [
      {
        name: 'Chrome 웹 스토어',
        value: '관리자가 차단하지 않은 모든 앱 설치 허용',
        inheritance: '로컬 단위로 적용됨',
        options: [
          'Google 기본값 사용',
          '관리자가 차단하지 않은 모든 앱 설치 허용',
          '허용 목록의 앱만 설치 허용',
          '허용 목록의 앱만 설치 허용(사용자가 확장 프로그램 요청 가능)',
        ],
      },
      {
        name: 'Google Play',
        value: '관리자가 차단하지 않은 모든 앱 설치 허용',
        inheritance: 'Google 기본값',
        options: [
          'Google 기본값 사용',
          '관리자가 차단하지 않은 모든 앱 설치 허용',
          '허용 목록의 앱만 설치 허용',
        ],
      },
      {
        name: '기타 소스에서 설치',
        value: '차단',
        inheritance: '로컬 단위로 적용됨',
        options: ['Google 기본값 사용', '허용', '차단'],
      },
    ],
  },
  {
    title: '고급 확장 차단',
    items: [
      {
        name: '권한 기반 차단',
        value: '사용 안함',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '사용', '사용 안함', '하위 설정 구성'],
      },
      {
        name: '차단된 권한',
        value: '항목 없음',
        inheritance: 'Google 기본값',
        options: [
          'Google 기본값 사용',
          '항목 없음',
          'clipboardRead',
          'cookies',
          'debugger',
          'proxy',
          'webRequest',
          'USB',
          '권한 목록 구성',
        ],
      },
      {
        name: '런타임 차단 호스트',
        value: '항목 없음',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '항목 없음', '호스트 패턴 추가', '학교 내부 URL 보호'],
      },
      {
        name: '런타임 허용 호스트',
        value: '항목 없음',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '항목 없음', '호스트 패턴 추가'],
      },
      {
        name: 'Chrome 웹 스토어 카테고리 차단',
        value: '사용 안함',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '사용', '사용 안함', '카테고리 선택'],
      },
    ],
  },
  {
    title: '웹스토어 설정',
    items: [
      {
        name: 'Chrome 웹 스토어 홈페이지',
        value: '허용',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '허용', '차단'],
      },
      {
        name: '비공개 게시 앱 설치',
        value: '허용',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '허용', '차단'],
      },
      {
        name: '수집 앱 게시',
        value: '허용 안함',
        inheritance: '로컬 단위로 적용됨',
        options: ['Google 기본값 사용', '허용', '허용 안함'],
      },
      {
        name: '인앱 구매',
        value: '허용',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '허용', '차단'],
      },
      {
        name: '확장 프로그램 요청 워크플로',
        value: '사용 안함',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '사용', '사용 안함'],
      },
    ],
  },
  {
    title: '추가 앱 설정',
    items: [
      {
        name: '강제 설치된 앱/확장 프로그램의 자동 업데이트',
        value: '허용',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '허용', '차단'],
      },
      {
        name: '앱/확장 프로그램 유형 허용',
        value: '확장 프로그램, 테마, 사용자 스크립트',
        inheritance: 'Google 기본값',
        options: [
          'Google 기본값 사용',
          '확장 프로그램, 테마, 사용자 스크립트',
          '확장 프로그램만',
          '모두 차단',
        ],
      },
      {
        name: '개발자 모드',
        value: '허용 안함',
        inheritance: '로컬 단위로 적용됨',
        options: ['Google 기본값 사용', '허용', '허용 안함'],
      },
      {
        name: '외부 확장 프로그램 설치 허용 URL',
        value: '항목 없음',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '항목 없음', 'URL 목록 구성'],
      },
      {
        name: '매니페스트 v2 확장 프로그램',
        value: '조직에서 허용된 경우 계속 사용',
        inheritance: 'Google 기본값',
        options: [
          'Google 기본값 사용',
          '조직에서 허용된 경우 계속 사용',
          '사용 중지',
          '강제 허용',
        ],
      },
      {
        name: '사이드 패널에서 확장 프로그램 고정',
        value: '사용자가 결정하도록 허용',
        inheritance: 'Google 기본값',
        options: ['Google 기본값 사용', '사용자가 결정하도록 허용', '강제 고정', '고정 안함'],
      },
    ],
  },
];
