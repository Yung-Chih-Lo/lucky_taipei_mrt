'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Alert, Button, Input, Spin, Tag, Typography, message } from 'antd'
import Link from 'next/link'
import { useThemeMode } from '@/components/ThemeProvider'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

type Station = {
  id: number
  name_zh: string
  name_en: string | null
  transport_type: 'mrt' | 'tra'
  county: string | null
}

type TokenInfo = { station: Station; comment_used: number }

type LoadState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'not_found' }
  | { kind: 'ok'; info: TokenInfo }

export default function CommentClient() {
  const { setMode } = useThemeMode()
  useEffect(() => {
    setMode('mrt')
  }, [setMode])

  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [content, setContent] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' })
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/comments/${encodeURIComponent(token)}`)
        if (cancelled) return
        if (res.status === 404) {
          setState({ kind: 'not_found' })
          return
        }
        if (res.status === 400) {
          setState({ kind: 'invalid' })
          return
        }
        const info = (await res.json()) as TokenInfo
        setState({ kind: 'ok', info })
      } catch {
        if (!cancelled) setState({ kind: 'not_found' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  const trimmed = content.trim()
  const canSubmit = trimmed.length >= 10 && trimmed.length <= 500 && !submitting && !submitted

  const handleSubmit = async () => {
    if (!token || !canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed, honeypot }),
      })
      if (res.status === 201) {
        setSubmitted(true)
        return
      }
      if (res.status === 409) {
        messageApi.warning('這個 token 已經留過心得了')
        if (state.kind === 'ok') {
          setState({ kind: 'ok', info: { ...state.info, comment_used: 1 } })
        }
        return
      }
      if (res.status === 429) {
        messageApi.warning('送出太快，請稍候')
        return
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      messageApi.error(data.error ? `送出失敗：${data.error}` : '送出失敗')
    } catch {
      messageApi.error('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const shareUrl = useMemo(() => {
    if (state.kind !== 'ok' || typeof window === 'undefined') return ''
    return `${window.location.origin}/explore?station_id=${state.info.station.id}`
  }, [state])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      messageApi.success('已複製連結')
    } catch (err) {
      console.error('copy failed:', err)
      messageApi.error('複製失敗')
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 64px' }}>
      {contextHolder}
      <Link href="/" style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
        ← 回首頁
      </Link>
      <Title level={1} style={{ marginTop: 16, color: 'var(--ink)' }}>
        留下心得
      </Title>

      {state.kind === 'loading' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}

      {state.kind === 'invalid' && (
        <Alert
          type="error"
          showIcon
          message="無效的 token"
          description="這個連結看起來不像是一個有效的留言連結。請從首頁重新抽一次。"
          action={<Link href="/">回首頁</Link>}
        />
      )}

      {state.kind === 'not_found' && (
        <Alert
          type="error"
          showIcon
          message="找不到這個 token"
          description="可能是抽籤紀錄已被清除，或連結有誤。"
          action={<Link href="/">回首頁</Link>}
        />
      )}

      {state.kind === 'ok' && (
        <>
          <div className="omikuji-card" style={cardStyle}>
            <Text type="secondary" style={{ fontSize: 12, letterSpacing: '0.16em' }}>
              你抽到的是
            </Text>
            <Title level={2} style={{ margin: '8px 0', color: 'var(--ink)' }}>
              {state.info.station.name_zh} 車站
            </Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <Tag color={state.info.station.transport_type === 'mrt' ? 'purple' : 'orange'}>
                {state.info.station.transport_type === 'mrt' ? '捷運' : '台鐵'}
              </Tag>
              {state.info.station.county && <Tag>{state.info.station.county}</Tag>}
            </div>
          </div>

          {state.info.comment_used === 1 && !submitted && (
            <Alert
              style={{ marginTop: 24 }}
              type="info"
              showIcon
              message="這個 token 已經留過心得了"
              description={
                <>
                  每個 token 只能留一次。
                  <br />
                  <Link href={`/explore?station_id=${state.info.station.id}`}>
                    去看看其他人在這個車站留下的心得 →
                  </Link>
                </>
              }
            />
          )}

          {state.info.comment_used === 0 && !submitted && (
            <div style={{ marginTop: 24 }}>
              <Paragraph style={{ color: 'var(--ink-muted)' }}>
                寫下你在這個車站的故事或感受（10–500 字）。送出後不能修改或刪除。
              </Paragraph>
              <TextArea
                rows={6}
                maxLength={500}
                showCount
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在這個車站，你遇到了什麼？看到了什麼？想到了什麼？"
              />
              {/* honeypot: hidden field for bot trap */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
                aria-hidden="true"
              />
              <Button
                type="primary"
                size="large"
                style={{ marginTop: 16 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
              >
                送出心得
              </Button>
            </div>
          )}

          {submitted && (
            <div className="omikuji-card" style={{ ...cardStyle, marginTop: 24 }}>
              <Title level={3} style={{ marginTop: 0, color: 'var(--ink)' }}>
                送出了，謝謝你
              </Title>
              <Paragraph style={{ color: 'var(--ink-muted)', whiteSpace: 'pre-wrap' }}>
                {trimmed}
              </Paragraph>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                <Button onClick={handleCopy}>複製分享連結</Button>
                <Link href={`/explore?station_id=${state.info.station.id}`}>
                  <Button type="primary">看看其他人的心得</Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 24,
  marginTop: 8,
}
