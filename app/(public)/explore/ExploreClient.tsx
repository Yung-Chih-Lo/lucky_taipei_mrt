'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Empty,
  Input,
  Pagination,
  Segmented,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useThemeMode } from '@/components/ThemeProvider'
import PickHistory from '@/components/PickHistory'

const { Title, Paragraph, Text } = Typography

type Comment = {
  id: number
  station_id: number
  content: string
  created_at: number
  name_zh: string
  transport_type: 'mrt' | 'tra'
  county: string | null
}

type ApiResponse = {
  comments: Comment[]
  total: number
  page: number
  total_pages: number
}

type Filter = 'all' | 'mrt' | 'tra'

const PAGE_SIZE = 5

function formatDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ExploreClient() {
  const { setMode } = useThemeMode()
  useEffect(() => {
    setMode('mrt')
  }, [setMode])

  const searchParams = useSearchParams()
  const stationIdParam = searchParams?.get('station_id') ?? null
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (stationIdParam) params.set('station_id', stationIdParam)
      if (filter !== 'all') params.set('transport_type', filter)
      if (search.trim()) params.set('q', search.trim())
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      const res = await fetch(`/api/comments?${params.toString()}`)
      const json = (await res.json()) as ApiResponse
      setData(json)
    } catch {
      setData({ comments: [], total: 0, page: 1, total_pages: 1 })
    } finally {
      setLoading(false)
    }
  }, [filter, search, page, stationIdParam])

  useEffect(() => {
    void load()
  }, [load])

  const handleFilterChange = (v: string | number) => {
    setFilter(v as Filter)
    setPage(1)
  }

  return (
    <div className="explore-layout">
      <aside className="explore-sidebar">
        <PickHistory />
      </aside>

      <main className="explore-main">
        <Link href="/" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
          ← 回首頁
        </Link>
        <Title level={1} style={{ marginTop: 16, color: 'var(--ink)' }}>
          旅人心得
        </Title>
        <Paragraph style={{ color: 'var(--ink-muted)' }}>
          每個人在每個車站留下的一段話。
        </Paragraph>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <Segmented
            value={filter}
            onChange={handleFilterChange}
            options={[
              { label: '全部', value: 'all' },
              { label: '捷運', value: 'mrt' },
              { label: '台鐵', value: 'tra' },
            ]}
          />
          <Input.Search
            allowClear
            placeholder="搜尋留言內容…"
            style={{ flex: 1, minWidth: 200 }}
            onSearch={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />
        </div>

        <Spin spinning={loading}>
          {data && data.comments.length === 0 ? (
            <Empty description="沒有符合條件的心得" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data?.comments.map((c) => (
                <article key={c.id} className="omikuji-card" style={cardStyle}>
                  <header style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <Tag color={c.transport_type === 'mrt' ? 'purple' : 'orange'} icon={<EnvironmentOutlined />}>
                      {c.name_zh} 車站
                    </Tag>
                    {c.county && <Tag>{c.county}</Tag>}
                    <Tag color="default">{c.transport_type === 'mrt' ? '捷運' : '台鐵'}</Tag>
                    <Text type="secondary" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <ClockCircleOutlined /> {formatDate(c.created_at)}
                    </Text>
                  </header>
                  <Paragraph style={{ margin: 0, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
                    {c.content}
                  </Paragraph>
                </article>
              ))}
            </div>
          )}

          {data && data.total_pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Pagination
                current={data.page}
                pageSize={PAGE_SIZE}
                total={data.total}
                showSizeChanger={false}
                onChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Spin>
      </main>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 16,
}
