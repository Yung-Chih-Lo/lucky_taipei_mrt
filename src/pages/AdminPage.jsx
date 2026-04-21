import React, { useState, useRef } from 'react'
import {
  Button, Form, Input, Modal, Checkbox, Alert, Typography, Space, Tag, Divider, message,
} from 'antd'
import { LogoutOutlined, DownloadOutlined, UploadOutlined, UndoOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import LeafletMap from '../components/LeafletMap.jsx'
import { getActiveMetroData, saveMetroDataToStorage, clearMetroDataStorage } from '../utils/metroDataLoader.js'
import { allMetroLineCodes, metroLineInfo } from '../constants/metroInfo.js'
import bundledData from '../data/metroData.json'

const { Title } = Typography

const lineColorMap = {
  BR: '#9c6b38', R: '#e3192a', RA: '#f5a0b5',
  G: '#008659', GA: '#99E64D', O: '#f5a622',
  BL: '#0070bd', Y: '#d4a017',
}

// ─── Login ───────────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    const correctPw = import.meta.env.VITE_PASSWORD
    if (!correctPw) {
      message.warning('VITE_PASSWORD 環境變數未設定，請在 Zeabur 設定')
      return
    }
    if (input === correctPw) {
      sessionStorage.setItem('admin_auth', 'true')
      onSuccess()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <LoginWrap>
      <LoginCard>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24, fontWeight: 500 }}>後台管理</Title>
        {error && (
          <Alert message="密碼錯誤" type="error" style={{ marginBottom: 16 }} />
        )}
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item>
            <Input.Password
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              placeholder="密碼"
              size="large"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large">登入</Button>
        </Form>
      </LoginCard>
    </LoginWrap>
  )
}

const LoginWrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
`
const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  width: 380px;
  max-width: 90vw;
`

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ onLogout }) {
  const [metroData, setMetroData] = useState(() => getActiveMetroData())
  const [editStation, setEditStation] = useState(null)   // station being edited
  const [addLatLng, setAddLatLng] = useState(null)       // lat/lng for new station
  const [editForm] = Form.useForm()
  const [addForm] = Form.useForm()
  const fileRef = useRef(null)
  const [msgApi, contextHolder] = message.useMessage()

  const updateData = (newData) => {
    setMetroData(newData)
    saveMetroDataToStorage(newData)
  }

  // Drag station to new position
  const handleDragEnd = (stationId, latlng) => {
    const newStations = metroData.stations.map(s =>
      s.id === stationId ? { ...s, lat: latlng.lat, lng: latlng.lng } : s
    )
    updateData({ ...metroData, stations: newStations })
  }

  // Click existing station → open edit modal
  const handleStationClick = (station) => {
    setEditStation(station)
    editForm.setFieldsValue({
      zh: station.name?.zh ?? '',
      en: station.name?.en ?? '',
      lines: station.lines ?? [],
    })
  }

  const handleSaveStation = () => {
    const vals = editForm.getFieldsValue()
    const newStations = metroData.stations.map(s =>
      s.id === editStation.id
        ? { ...s, name: { ...s.name, zh: vals.zh, en: vals.en }, lines: vals.lines }
        : s
    )
    // Update stationNameToId if name changed
    const oldName = editStation.name?.zh
    const newName = vals.zh
    const newStationNameToId = { ...metroData.stationNameToId }
    if (oldName !== newName) {
      delete newStationNameToId[oldName]
      newStationNameToId[newName] = editStation.id
    }
    updateData({ ...metroData, stations: newStations, stationNameToId: newStationNameToId })
    setEditStation(null)
    msgApi.success('站點已更新')
  }

  const handleDeleteStation = () => {
    const newStations = metroData.stations.filter(s => s.id !== editStation.id)
    const newStationNameToId = { ...metroData.stationNameToId }
    delete newStationNameToId[editStation.name?.zh]
    updateData({ ...metroData, stations: newStations, stationNameToId: newStationNameToId })
    setEditStation(null)
    msgApi.success('站點已刪除')
  }

  // Click empty map area → open add station modal
  const handleMapClick = (latlng) => {
    setAddLatLng(latlng)
    addForm.resetFields()
  }

  const handleAddStation = () => {
    const vals = addForm.getFieldsValue()
    if (!vals.zh?.trim()) return
    const newId = Math.max(...metroData.stations.map(s => s.id), -1) + 1
    const newStation = {
      id: newId,
      name: { zh: vals.zh.trim(), en: vals.en?.trim() ?? '', pos: { x: 0, y: 0, anchor: 'start' } },
      center: { x: 0, y: 0 },
      lines: vals.lines ?? [],
      label: vals.zh.trim(),
      lat: addLatLng.lat,
      lng: addLatLng.lng,
    }
    const newStationNameToId = { ...metroData.stationNameToId, [newStation.name.zh]: newId }
    updateData({
      ...metroData,
      stations: [...metroData.stations, newStation],
      stationNameToId: newStationNameToId,
    })
    setAddLatLng(null)
    msgApi.success(`新增站點「${newStation.name.zh}」`)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(metroData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'metroData.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!parsed?.stations?.length) throw new Error('invalid')
        updateData(parsed)
        msgApi.success('資料已匯入')
      } catch {
        msgApi.error('JSON 格式錯誤')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    clearMetroDataStorage()
    setMetroData(bundledData)
    msgApi.success('已還原為預設資料')
  }

  return (
    <AdminWrap>
      {contextHolder}
      <Toolbar>
        <Title level={4} style={{ margin: 0 }}>🗺️ 站點管理後台</Title>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>匯出 JSON</Button>
          <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>匯入 JSON</Button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <Button icon={<UndoOutlined />} danger onClick={handleReset}>還原預設</Button>
          <Button icon={<LogoutOutlined />} onClick={onLogout}>登出</Button>
        </Space>
      </Toolbar>
      <HintBar>
        <Text type="secondary">🖱️ 拖動標記調整站點位置 ⋅ 點擊標記編輯 ⋅ 點擊空白地圖新增站點</Text>
        <Text type="secondary">共 {metroData.stations.length} 個站點</Text>
      </HintBar>
      <MapWrap>
        <LeafletMap
          metroData={metroData}
          adminMode={true}
          onStationDragEnd={handleDragEnd}
          onStationClick={handleStationClick}
          onMapClick={handleMapClick}
        />
      </MapWrap>

      {/* Edit Station Modal */}
      <Modal
        title="編輯站點"
        open={!!editStation}
        onOk={handleSaveStation}
        onCancel={() => setEditStation(null)}
        okText="儲存"
        cancelText="取消"
        footer={[
          <Button key="delete" danger onClick={handleDeleteStation}>刪除站點</Button>,
          <Button key="cancel" onClick={() => setEditStation(null)}>取消</Button>,
          <Button key="ok" type="primary" onClick={handleSaveStation}>儲存</Button>,
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="中文站名" name="zh" rules={[{ required: true, message: '請填入中文站名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="英文站名" name="en">
            <Input />
          </Form.Item>
          <Form.Item label="所屬線路" name="lines">
            <Checkbox.Group>
              <Space wrap>
                {allMetroLineCodes.map(code => (
                  <Checkbox key={code} value={code}>
                    <Tag color={lineColorMap[code]}>{metroLineInfo[code]?.name ?? code}</Tag>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Station Modal */}
      <Modal
        title="新增站點"
        open={!!addLatLng}
        onOk={handleAddStation}
        onCancel={() => setAddLatLng(null)}
        okText="新增"
        cancelText="取消"
      >
        {addLatLng && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            座標：{addLatLng.lat.toFixed(5)}, {addLatLng.lng.toFixed(5)}
          </Text>
        )}
        <Form form={addForm} layout="vertical">
          <Form.Item label="中文站名" name="zh" rules={[{ required: true, message: '請填入中文站名' }]}>
            <Input placeholder="例：新站" />
          </Form.Item>
          <Form.Item label="英文站名" name="en">
            <Input placeholder="例：New Station" />
          </Form.Item>
          <Form.Item label="所屬線路" name="lines">
            <Checkbox.Group>
              <Space wrap>
                {allMetroLineCodes.map(code => (
                  <Checkbox key={code} value={code}>
                    <Tag color={lineColorMap[code]}>{metroLineInfo[code]?.name ?? code}</Tag>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </AdminWrap>
  )
}

const AdminWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
`
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
`
const HintBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 20px;
  background: #fffbe6;
  border-bottom: 1px solid #ffe58f;
  font-size: 13px;
  flex-wrap: wrap;
  gap: 4px;
`
const MapWrap = styled.div`
  flex: 1;
  min-height: 0;
`

// ─── AdminPage (guard) ────────────────────────────────────────────────────────

function AdminPage() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  )

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />
  }
  return <AdminPanel onLogout={handleLogout} />
}

export default AdminPage
