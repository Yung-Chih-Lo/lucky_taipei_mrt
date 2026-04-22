'use client'

import { Button, Checkbox, Divider } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import type { LineView } from './types'

type Props = {
  lines: LineView[]
  selectedLineCodes: string[]
  onLineChange: (codes: string[]) => void
  onRandomPick: () => void
  isAnimating: boolean
}

export default function Sidebar({
  lines,
  selectedLineCodes,
  onLineChange,
  onRandomPick,
  isAnimating,
}: Props) {
  const allCodes = lines.map((l) => l.code)
  const pickDisabled = selectedLineCodes.length === 0 || isAnimating

  return (
    <div style={containerStyle}>
      <p style={sectionLabelStyle}>選擇你的出發路線</p>

      <div style={selectRowStyle}>
        <Button
          type="link"
          size="small"
          onClick={() => onLineChange(allCodes)}
          disabled={selectedLineCodes.length === allCodes.length}
        >
          全選
        </Button>
        <Button
          type="link"
          size="small"
          onClick={() => onLineChange([])}
          disabled={selectedLineCodes.length === 0}
        >
          全部取消
        </Button>
      </div>

      <div style={listScrollStyle}>
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          value={selectedLineCodes}
          onChange={(vals) => onLineChange(vals as string[])}
        >
          {lines.map((line) => (
            <Checkbox key={line.code} value={line.code}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  backgroundColor: line.color,
                  borderRadius: '50%',
                  marginRight: 8,
                  verticalAlign: 'middle',
                  boxShadow: '0 0 0 1px var(--rule-strong)',
                }}
              />
              {line.nameZh ?? line.code}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>

      <Divider style={{ margin: '0 0 16px 0' }} />

      <p style={summaryStyle}>
        已選 <strong style={{ color: 'var(--ink)' }}>{selectedLineCodes.length}</strong> 條路線
      </p>

      <Button
        type="primary"
        block
        size="large"
        onClick={onRandomPick}
        disabled={pickDisabled}
        loading={isAnimating}
        icon={<SwapOutlined />}
      >
        {isAnimating ? '列車行駛中…' : '命．中．注．站'}
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
  textAlign: 'left',
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
