import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import StyledComponentsRegistry from './registry';
import './globals.css';

export const metadata = {
  title: 'Lucky Station',
  icons: {
    icon: '/train.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>
        <StyledComponentsRegistry>
          <AntdRegistry>
            {children}
          </AntdRegistry>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
