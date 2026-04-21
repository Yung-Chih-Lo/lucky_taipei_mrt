import React from 'react'
import { Checkbox, Button, Divider, Typography } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const { Title } = Typography

const SidebarWrapper = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
`
const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`
const ButtonGroup = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
`
const CheckboxListContainer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-bottom: 16px;
`
const MainButtonWrapper = styled.div`
  padding: 0;
  margin-top: auto;
`

function Sidebar({
  selectedLines = [],
  onLineChange,
  metroLineCodes = [],
  metroLineInfo = {},
  onRandomPick,
  isPickButtonDisabled,
  isAnimating = false,
}) {
  const handleSelectAll = () => onLineChange(metroLineCodes)
  const handleDeselectAll = () => onLineChange([])

  const metroLineOptions = metroLineCodes.map(code => ({
    label: metroLineInfo[code]?.name ?? code,
    value: code,
    lineColor: metroLineInfo[code]?.color ?? '#cccccc',
  }))

  return (
    <SidebarWrapper>
      <TitleContainer>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>隨機捷運 GO！ 🚇</Title>
        <p style={{ marginTop: 4, marginBottom: 0, color: 'rgba(0,0,0,0.45)', fontSize: '0.9em' }}>
          選擇線路，尋找你的下一站
        </p>
      </TitleContainer>

      <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 12 }}>選擇想搭的線路：</p>
      <ButtonGroup>
        <Button type="link" size="small" onClick={handleSelectAll} disabled={selectedLines.length === metroLineCodes.length}>全選</Button>
        <Button type="link" size="small" onClick={handleDeselectAll} disabled={selectedLines.length === 0}>全部取消</Button>
      </ButtonGroup>

      <CheckboxListContainer>
        <Checkbox.Group
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          value={selectedLines}
          onChange={onLineChange}
        >
          {metroLineOptions.map(opt => (
            <Checkbox key={opt.value} value={opt.value}>
              <span style={{
                display: 'inline-block',
                width: 12, height: 12,
                backgroundColor: opt.lineColor,
                borderRadius: '50%',
                marginRight: 8,
                verticalAlign: 'middle',
                boxShadow: '0 0 1px rgba(0,0,0,0.5)',
                border: '1px solid rgba(0,0,0,0.1)',
              }} />
              {opt.label}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </CheckboxListContainer>

      <Divider style={{ margin: '0 0 16px 0' }} />

      <MainButtonWrapper>
        <Button
          type="primary"
          block
          size="large"
          onClick={onRandomPick}
          disabled={isPickButtonDisabled || isAnimating}
          loading={isAnimating}
          icon={<SwapOutlined />}
        >
          {isAnimating ? '列車行駛中...' : '抽取幸運捷運站！'}
        </Button>
      </MainButtonWrapper>
    </SidebarWrapper>
  )
}

Sidebar.propTypes = {
  selectedLines: PropTypes.arrayOf(PropTypes.string),
  onLineChange: PropTypes.func,
  metroLineCodes: PropTypes.arrayOf(PropTypes.string),
  metroLineInfo: PropTypes.object,
  onRandomPick: PropTypes.func,
  isPickButtonDisabled: PropTypes.bool,
  isAnimating: PropTypes.bool,
}

export default Sidebar
