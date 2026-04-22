'use client'

import { Button, Checkbox, Divider } from 'antd'
import { SwapOutlined } from '@ant-design/icons'

type Props = {
  counties: string[]
  selectedCounties: string[]
  onChange: (counties: string[]) => void
  onPick: () => void
  isPicking: boolean
}

export default function TraSidebar({
  counties,
  selectedCounties,
  onChange,
  onPick,
  isPicking,
}: Props) {
  const allSelected = selectedCounties.length === counties.length
  const noneSelected = selectedCounties.length === 0
  const pickDisabled = noneSelected || isPicking

  return (
    <div style={containerStyle}>
      <p style={sectionLabelStyle}>選擇你的出發縣市</p>

      <div style={selectRowStyle}>
        <Button
          type="link"
          size="small"
          onClick={() => onChange(counties)}
          disabled={allSelected}
        >
          全選
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => onChange([])}
          disabled={noneSelected}
        >
          清除
        </Button>
      </div>

      <div style={listScrollStyle}>
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          value={selectedCounties}
          onChange={(vals) => onChange(vals as string[])}
        >
          {counties.map((county) => (
            <Checkbox key={county} value={county}>
              {county}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>

      <Divider style={{ margin: '0 0 16px 0' }} />

      <p style={summaryStyle}>
        已選 <strong style={{ color: 'var(--ink)' }}>{selectedCounties.length}</strong> 個縣市
      </p>

      <Button
        type="primary"
        block
        size="large"
        onClick={onPick}
        disabled={pickDisabled}
        loading={isPicking}
        icon={<SwapOutlined />}
      >
        {isPicking ? '抽籤中…' : '命．中．注．站'}
      </Button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
}

const sectionLabelStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-serif), "Noto Serif TC", ui-serif, serif',
  fontWeight: 700,
  marginBottom: 12,
  color: 'var(--ink)',
  fontSize: 18,
  letterSpacing: '0.06em',
}

const selectRowStyle: React.CSSProperties = {
  marginBottom: 12,
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 4px',
}

const listScrollStyle: React.CSSProperties = {
  flexGrow: 1,
  overflowY: 'auto',
  paddingRight: 8,
  marginBottom: 16,
  minHeight: 0,
  maxHeight: 'clamp(220px, 45vh, 420px)',
}

const summaryStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 13,
  letterSpacing: '0.08em',
  color: 'var(--ink-muted)',
}
