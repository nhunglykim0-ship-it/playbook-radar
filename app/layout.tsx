import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Playbook Radar - OpenClaw 玩法情报站',
  description: '发现全球 OpenClaw 最新玩法、教程和案例',
  keywords: 'OpenClaw, 自动化，AI, 一人公司，内容工厂，webhook',
  authors: [{ name: 'Playbook Radar Team' }],
  openGraph: {
    title: 'Playbook Radar - OpenClaw 玩法情报站',
    description: '发现全球 OpenClaw 最新玩法、教程和案例',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playbook Radar - OpenClaw 玩法情报站',
    description: '发现全球 OpenClaw 最新玩法、教程和案例',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Plausible Analytics - 隐私友好的分析工具 */}
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'playbook-radar.example.com'}
          src={process.env.NEXT_PUBLIC_PLAUSIBLE_URL || 'https://plausible.io/js/script.js'}
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
