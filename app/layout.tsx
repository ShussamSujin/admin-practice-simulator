import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://admin-c-2026.gajungssamzzang.chatgpt.site'),
  title: 'Admin C 2026 | 관리 콘솔 교육용 시뮬레이터',
  description: '관리자 연수를 위한 비공식 교육용 시뮬레이터입니다. 실제 설정은 변경되지 않습니다.',
  openGraph: {
    title: 'Admin C 2026 | 관리 콘솔 교육용 시뮬레이터',
    description: '안전하게 눌러보며 익히는 Google Workspace 관리자 연수',
    type: 'website',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Admin C 2026 | 관리 콘솔 교육용 시뮬레이터',
    description: '안전하게 눌러보며 익히는 Google Workspace 관리자 연수',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
