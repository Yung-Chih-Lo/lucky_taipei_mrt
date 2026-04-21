'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, Button, Form, Input, Typography } from 'antd'

const { Title } = Typography

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams?.get('from') || '/admin'

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: { username: string; password: string }) {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (res.status === 200) {
        router.replace(from)
        router.refresh()
        return
      }
      if (res.status === 401) {
        setError('帳號或密碼錯誤')
        return
      }
      setError('登入失敗，請稍後再試')
    } catch {
      setError('連線失敗，請檢查網路')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>
          後台管理
        </Title>
        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={handleSubmit} disabled={submitting}>
          <Form.Item
            label="帳號"
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password size="large" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            登入
          </Button>
        </Form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f0f2f5',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: 40,
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  width: 380,
  maxWidth: '90vw',
}
