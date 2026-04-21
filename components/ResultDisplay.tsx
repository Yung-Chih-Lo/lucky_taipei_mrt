'use client'

import { Empty, Typography } from 'antd'
import { CarOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons'
import type { LineView, StationView } from './types'

const { Title } = Typography

type Props = {
  station: StationView | null
  lines: LineView[]
}

export default function ResultDisplay({ station, lines }: Props) {
  if (!station) {
    return (
      <div style={containerStyle}>
        <Empty description="尚未抽取目的地" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const lineName = (code: string) => lines.find((l) => l.code === code)?.nameZh ?? code
  const lineSubtitle = station.lineCodes.map(lineName).join(' / ')
  const wikiLink = `https://zh.wikipedia.org/wiki/${encodeURIComponent(station.nameZh)}站_(台北捷運)`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    station.nameZh,
  )}+捷運站`

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 4, color: '#1890ff' }}>
          <CarOutlined style={{ marginRight: 8 }} />「{station.nameZh}」站
        </Title>
        {lineSubtitle && (
          <p style={{ color: 'rgba(0,0,0,0.45)', margin: 0 }}>{lineSubtitle}</p>
        )}
      </div>
      <div style={linksContainerStyle}>
        <a href={wikiLink} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          <GlobalOutlined style={{ marginRight: 6 }} /> 維基百科
        </a>
        <a href={mapLink} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          <EnvironmentOutlined style={{ marginRight: 6 }} /> Google Map
        </a>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '30px 20px',
  backgroundColor: '#f0f2f5',
  borderRadius: 8,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  maxWidth: 400,
  margin: '0 auto',
  border: '1px solid #d9d9d9',
  minHeight: 180,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}

const linksContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 20,
  marginTop: 20,
  paddingTop: 20,
  borderTop: '1px dashed #d9d9d9',
  width: '100%',
}

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#1890ff',
  textDecoration: 'none',
}
