'use client'

export default function FirstArrivalCard() {
  return (
    <div style={cardStyle}>
      <p style={eyebrowStyle}>首　旅　人</p>
      <p style={bodyStyle}>此站尚無人留言，你是第一位抵達的旅人。</p>
      <p style={subtextStyle}>FIRST TO ARRIVE · 彩蛋 ✦</p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '8px 14px',
  border: '1.5px dashed var(--rule-strong)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  textAlign: 'center',
  color: 'var(--ink)',
}

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  letterSpacing: '0.32em',
  color: 'var(--ink-muted)',
}

const bodyStyle: React.CSSProperties = {
  margin: '4px 0',
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontStyle: 'italic',
  fontSize: 14,
  lineHeight: 1.4,
  color: 'var(--ink)',
}

const subtextStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans), "Noto Sans TC", system-ui, sans-serif',
  fontSize: 10,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}
