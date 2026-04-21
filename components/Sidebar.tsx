'use client'

import { Button, Checkbox, Divider, Typography } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import type { LineView } from './types'

const { Title } = Typography

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
    <div
      style={{
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          隨機捷運 GO！ 🚇
        </Title>
        <p
          style={{
            marginTop: 4,
            marginBottom: 0,
            color: 'rgba(0,0,0,0.45)',
            fontSize: '0.9em',
          }}
        >
          選擇線路，尋找你的下一站
        </p>
      </div>

      <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 12 }}>
        選擇想搭的線路：
      </p>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 8px',
        }}
      >
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

      <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 16 }}>
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
                  boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              {line.nameZh ?? line.code}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>

      <Divider style={{ margin: '0 0 16px 0' }} />

      <div style={{ marginTop: 'auto' }}>
        <Button
          type="primary"
          block
          size="large"
          onClick={onRandomPick}
          disabled={pickDisabled}
          loading={isAnimating}
          icon={<SwapOutlined />}
        >
          {isAnimating ? '列車行駛中...' : '抽取幸運捷運站！'}
        </Button>
      </div>
    </div>
  )
}
