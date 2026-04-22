'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useThemeMode } from '@/components/ThemeProvider'
import type { ThemeMode } from '@/lib/theme'

const MODE_LABEL: Record<ThemeMode, string> = {
  mrt: '捷運',
  tra: '台鐵',
}

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/explore', label: '旅人心得' },
  { href: '/stats', label: '排行榜' },
]

export default function TopBar() {
  const { mode, setMode } = useThemeMode()
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'

  const selectMode = (next: ThemeMode) => {
    setMode(next)
    if (!isHome) {
      router.push('/')
    }
  }

  return (
    <header style={barStyle}>
      <Link href="/" style={wordmarkLinkStyle} aria-label="回到首頁">
        <span style={wordmarkPrimaryStyle}>坐火行</span>
      </Link>

      <nav style={tabsStyle} aria-label="選擇運輸類型">
        {(Object.keys(MODE_LABEL) as ThemeMode[]).map((m) => {
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => selectMode(m)}
              style={{
                ...tabButtonStyle,
                color: active ? 'var(--accent)' : 'var(--ink-muted)',
                borderBottomColor: active ? 'var(--accent)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
              aria-current={active ? 'page' : undefined}
            >
              {MODE_LABEL[m]}
            </button>
          )
        })}
      </nav>

      <div style={navRightStyle}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...navLinkStyle,
                color: active ? 'var(--ink)' : 'var(--ink-muted)',
                borderBottomColor: active ? 'var(--accent)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}

const barStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 20,
  height: 64,
  display: 'grid',
  gridTemplateColumns: 'minmax(140px, 1fr) auto minmax(140px, 1fr)',
  alignItems: 'center',
  gap: 16,
  padding: '0 24px',
  background: 'var(--paper-surface)',
  borderBottom: '1px solid var(--rule)',
  backgroundImage: `repeating-linear-gradient(90deg, var(--rule-strong) 0, var(--rule-strong) 4px, transparent 4px, transparent 12px)`,
  backgroundPosition: 'bottom left',
  backgroundRepeat: 'repeat-x',
  backgroundSize: '100% 1px',
}

const wordmarkLinkStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  lineHeight: 1.05,
  textDecoration: 'none',
  color: 'var(--ink)',
}

const wordmarkPrimaryStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 900,
  fontSize: 20,
  letterSpacing: '0.08em',
  color: 'var(--ink)',
}

const wordmarkCaptionStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: '0.32em',
  color: 'var(--ink-muted)',
  textTransform: 'uppercase',
}

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  justifySelf: 'center',
}

const tabButtonStyle: React.CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '18px 14px 16px',
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 15,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  transition: 'color 200ms ease, border-color 200ms ease',
}

const navRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 20,
}

const navLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.12em',
  textDecoration: 'none',
  paddingBottom: 2,
  borderBottom: '2px solid transparent',
  transition: 'color 200ms ease, border-color 200ms ease',
}
