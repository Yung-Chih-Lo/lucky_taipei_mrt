import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import './globals.css'

const notoSans = Noto_Sans_TC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const notoSerif = Noto_Serif_TC({
  weight: ['500', '900'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '坐火行 | 一鍵抽站，說走就走',
  description: '不知道今天去哪？選條路線，讓命運決定你的下一站。台北捷運與台鐵隨機抽站。',
  icons: { icon: '/train.png' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-TW"
      data-theme="mrt"
      className={`${notoSans.variable} ${notoSerif.variable}`}
    >
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
