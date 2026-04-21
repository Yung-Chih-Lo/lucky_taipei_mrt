import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AntdRegistry } from '@ant-design/nextjs-registry'

export const metadata: Metadata = {
  title: 'Lucky Station',
  icons: { icon: '/train.png' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  )
}
