'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Typography,
  message as antdMessage,
} from 'antd'
import { DownloadOutlined, LogoutOutlined } from '@ant-design/icons'
import SchematicMap, { type StationPositionChange } from './SchematicMap'
import type { CanvasView, ConnectionView, LabelAnchor, LineView, StationView } from './types'

const { Title } = Typography

type Props = {
  initialStations: StationView[]
  connections: ConnectionView[]
  lines: LineView[]
  canvas: CanvasView
}

type EditModalState =
  | { mode: 'add'; svgX: number; svgY: number }
  | { mode: 'edit'; station: StationView }
  | null

type AnchorPopoverState = {
  id: number
  screenX: number
  screenY: number
} | null

export default function AdminClient({
  initialStations,
  connections,
  lines,
  canvas,
}: Props) {
  const router = useRouter()
  const [stations, setStations] = useState<StationView[]>(initialStations)
  const [editModal, setEditModal] = useState<EditModalState>(null)
  const [anchorPopover, setAnchorPopover] = useState<AnchorPopoverState>(null)
  const [msgApi, contextHolder] = antdMessage.useMessage()

  const updateStationLocal = useCallback((id: number, patch: Partial<StationView>) => {
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const replaceStationLocal = useCallback((next: StationView) => {
    setStations((prev) => prev.map((s) => (s.id === next.id ? next : s)))
  }, [])

  const patchStation = useCallback(
    async (id: number, body: Record<string, unknown>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/admin/stations/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.status === 200) {
          const row = await res.json()
          replaceStationLocal({
            id: row.id,
            nameZh: row.nameZh,
            nameEn: row.nameEn,
            schematicX: row.schematicX,
            schematicY: row.schematicY,
            labelX: row.labelX,
            labelY: row.labelY,
            labelAnchor: row.labelAnchor,
            lineCodes: row.lineCodes ?? [],
          })
          return true
        }
        if (res.status === 409) {
          const j = await res.json()
          msgApi.error(j.error ?? '站名重複')
        } else if (res.status === 401) {
          msgApi.error('未登入,請重新登入')
          router.push('/admin/login')
        } else {
          msgApi.error('儲存失敗')
        }
        return false
      } catch {
        msgApi.error('連線失敗')
        return false
      }
    },
    [msgApi, replaceStationLocal, router],
  )

  const handleStationPositionChange = useCallback(
    async (id: number, next: StationPositionChange) => {
      const prev = stations.find((s) => s.id === id)
      if (!prev) return
      updateStationLocal(id, {
        schematicX: next.schematicX,
        schematicY: next.schematicY,
        labelX: next.labelX,
        labelY: next.labelY,
      })
      const ok = await patchStation(id, next)
      if (!ok) {
        updateStationLocal(id, {
          schematicX: prev.schematicX,
          schematicY: prev.schematicY,
          labelX: prev.labelX,
          labelY: prev.labelY,
        })
      } else {
        msgApi.success('位置已儲存', 1)
      }
    },
    [stations, updateStationLocal, patchStation, msgApi],
  )

  const handleLabelPositionChange = useCallback(
    async (id: number, labelX: number, labelY: number) => {
      const prev = stations.find((s) => s.id === id)
      if (!prev) return
      updateStationLocal(id, { labelX, labelY })
      const ok = await patchStation(id, { labelX, labelY })
      if (!ok) {
        updateStationLocal(id, { labelX: prev.labelX, labelY: prev.labelY })
      } else {
        msgApi.success('標籤位置已儲存', 1)
      }
    },
    [stations, updateStationLocal, patchStation, msgApi],
  )

  const handleStationClick = useCallback(
    (id: number) => {
      const station = stations.find((s) => s.id === id)
      if (!station) return
      setEditModal({ mode: 'edit', station })
    },
    [stations],
  )

  const handleLabelClick = useCallback((id: number) => {
    // Position anchor popover near the label by getting the element's bounding rect
    const el = document.querySelector<SVGTextElement>(`[data-label-id="${id}"]`)
    if (el) {
      const rect = el.getBoundingClientRect()
      setAnchorPopover({ id, screenX: rect.left + rect.width / 2, screenY: rect.bottom + 4 })
    } else {
      setAnchorPopover({ id, screenX: window.innerWidth / 2, screenY: window.innerHeight / 2 })
    }
  }, [])

  const handleBackgroundClick = useCallback((svgX: number, svgY: number) => {
    setEditModal({ mode: 'add', svgX, svgY })
  }, [])

  const handleAnchorChoice = useCallback(
    async (id: number, anchor: LabelAnchor) => {
      setAnchorPopover(null)
      const ok = await patchStation(id, { labelAnchor: anchor })
      if (ok) msgApi.success('錨點已儲存', 1)
    },
    [patchStation, msgApi],
  )

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }, [router])

  return (
    <div style={wrapStyle}>
      {contextHolder}
      <div style={toolbarStyle}>
        <Title level={4} style={{ margin: 0 }}>🗺️ 站點管理後台</Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => window.open('/api/admin/export', '_blank')}
          >
            匯出備份
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>登出</Button>
        </Space>
      </div>
      <div style={hintBarStyle}>
        <span>🖱️ 拖動圓點 = 移站點 ⋅ 拖動文字 = 移標籤 ⋅ 點文字 = 改錨點 ⋅ 點空白 = 新增</span>
        <span>共 {stations.length} 個站點</span>
      </div>
      <div style={mapWrapStyle}>
        <SchematicMap
          stations={stations}
          connections={connections}
          lines={lines}
          canvas={canvas}
          adminMode
          onStationPositionChange={handleStationPositionChange}
          onLabelPositionChange={handleLabelPositionChange}
          onStationClick={handleStationClick}
          onLabelClick={handleLabelClick}
          onBackgroundClick={handleBackgroundClick}
        />
      </div>

      {editModal?.mode === 'add' && (
        <AddStationModal
          svgX={editModal.svgX}
          svgY={editModal.svgY}
          lines={lines}
          onClose={() => setEditModal(null)}
          onCreated={(row) => {
            setStations((prev) => [...prev, row])
            setEditModal(null)
            msgApi.success(`新增站點「${row.nameZh}」`)
          }}
          onError={(err) => msgApi.error(err)}
        />
      )}

      {editModal?.mode === 'edit' && (
        <EditStationModal
          station={editModal.station}
          lines={lines}
          onClose={() => setEditModal(null)}
          onSaved={(row) => {
            replaceStationLocal(row)
            setEditModal(null)
            msgApi.success('站點已更新')
          }}
          onDeleted={(id) => {
            setStations((prev) => prev.filter((s) => s.id !== id))
            setEditModal(null)
            msgApi.success('站點已刪除')
          }}
          onError={(err) => msgApi.error(err)}
        />
      )}

      {anchorPopover && (
        <AnchorSwitcherPopover
          screenX={anchorPopover.screenX}
          screenY={anchorPopover.screenY}
          current={stations.find((s) => s.id === anchorPopover.id)?.labelAnchor ?? 'middle'}
          onSelect={(anchor) => handleAnchorChoice(anchorPopover.id, anchor)}
          onClose={() => setAnchorPopover(null)}
        />
      )}
    </div>
  )
}

function AddStationModal({
  svgX,
  svgY,
  lines,
  onClose,
  onCreated,
  onError,
}: {
  svgX: number
  svgY: number
  lines: LineView[]
  onClose: () => void
  onCreated: (row: StationView) => void
  onError: (err: string) => void
}) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(values: { nameZh: string; nameEn?: string; lineCodes?: string[] }) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/stations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nameZh: values.nameZh.trim(),
          nameEn: values.nameEn?.trim() || null,
          schematicX: svgX,
          schematicY: svgY,
          lineCodes: values.lineCodes ?? [],
        }),
      })
      if (res.status === 200) {
        const row = await res.json()
        onCreated({
          id: row.id,
          nameZh: row.nameZh,
          nameEn: row.nameEn,
          schematicX: row.schematicX,
          schematicY: row.schematicY,
          labelX: row.labelX,
          labelY: row.labelY,
          labelAnchor: row.labelAnchor,
          lineCodes: row.lineCodes ?? [],
        })
      } else {
        const j = await res.json().catch(() => ({}))
        onError(j.error ?? '新增失敗')
      }
    } catch {
      onError('連線失敗')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="新增站點"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: submitting }}
      okText="新增"
      cancelText="取消"
    >
      <p style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>
        座標:{svgX.toFixed(1)}, {svgY.toFixed(1)}
      </p>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="中文站名"
          name="nameZh"
          rules={[{ required: true, message: '請填入中文站名' }]}
        >
          <Input placeholder="例:新站" autoFocus />
        </Form.Item>
        <Form.Item label="英文站名" name="nameEn">
          <Input placeholder="例:New Station" />
        </Form.Item>
        <Form.Item label="所屬線路" name="lineCodes">
          <Checkbox.Group>
            <Space wrap>
              {lines.map((l) => (
                <Checkbox key={l.code} value={l.code}>
                  <Tag color={l.color}>{l.nameZh ?? l.code}</Tag>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

function EditStationModal({
  station,
  lines,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: {
  station: StationView
  lines: LineView[]
  onClose: () => void
  onSaved: (row: StationView) => void
  onDeleted: (id: number) => void
  onError: (err: string) => void
}) {
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(values: {
    nameZh: string
    nameEn?: string | null
    lineCodes?: string[]
  }) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nameZh: values.nameZh.trim(),
          nameEn: values.nameEn?.trim() || null,
          lineCodes: values.lineCodes ?? [],
        }),
      })
      if (res.status === 200) {
        const row = await res.json()
        onSaved({
          id: row.id,
          nameZh: row.nameZh,
          nameEn: row.nameEn,
          schematicX: row.schematicX,
          schematicY: row.schematicY,
          labelX: row.labelX,
          labelY: row.labelY,
          labelAnchor: row.labelAnchor,
          lineCodes: row.lineCodes ?? [],
        })
      } else {
        const j = await res.json().catch(() => ({}))
        onError(j.error ?? '儲存失敗')
      }
    } catch {
      onError('連線失敗')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, { method: 'DELETE' })
      if (res.status === 200) {
        onDeleted(station.id)
      } else {
        onError('刪除失敗')
      }
    } catch {
      onError('連線失敗')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      title="編輯站點"
      open
      onCancel={onClose}
      footer={[
        <Button key="delete" danger loading={deleting} onClick={handleDelete}>
          刪除站點
        </Button>,
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="save" type="primary" loading={submitting} onClick={() => form.submit()}>
          儲存
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          nameZh: station.nameZh,
          nameEn: station.nameEn ?? '',
          lineCodes: station.lineCodes,
        }}
      >
        <Form.Item
          label="中文站名"
          name="nameZh"
          rules={[{ required: true, message: '請填入中文站名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="英文站名" name="nameEn">
          <Input />
        </Form.Item>
        <Form.Item label="所屬線路" name="lineCodes">
          <Checkbox.Group>
            <Space wrap>
              {lines.map((l) => (
                <Checkbox key={l.code} value={l.code}>
                  <Tag color={l.color}>{l.nameZh ?? l.code}</Tag>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}

function AnchorSwitcherPopover({
  screenX,
  screenY,
  current,
  onSelect,
  onClose,
}: {
  screenX: number
  screenY: number
  current: LabelAnchor
  onSelect: (anchor: LabelAnchor) => void
  onClose: () => void
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: screenX,
          top: screenY,
          transform: 'translateX(-50%)',
          zIndex: 1001,
          background: 'white',
          borderRadius: 6,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          padding: 4,
          display: 'flex',
          gap: 4,
        }}
      >
        {(['start', 'middle', 'end'] as LabelAnchor[]).map((a) => (
          <button
            key={a}
            onClick={() => onSelect(a)}
            style={{
              border: 'none',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              background: current === a ? '#1890ff' : '#f0f2f5',
              color: current === a ? 'white' : '#333',
              fontSize: 13,
              minWidth: 56,
            }}
          >
            {a === 'start' ? '◀ 靠左' : a === 'middle' ? '◆ 置中' : '靠右 ▶'}
          </button>
        ))}
      </div>
    </>
  )
}

const wrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: '#f0f2f5',
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  background: 'white',
  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  flexShrink: 0,
  flexWrap: 'wrap',
  gap: 8,
}

const hintBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 20px',
  background: '#fffbe6',
  borderBottom: '1px solid #ffe58f',
  fontSize: 13,
  flexWrap: 'wrap',
  gap: 4,
  color: 'rgba(0,0,0,0.65)',
}

const mapWrapStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  background: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}
