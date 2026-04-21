import React from 'react'
import { Typography, Empty } from 'antd'
import { GlobalOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { metroLineInfo } from '../constants/metroInfo.js'

const { Title } = Typography

const ResultContainer = styled.div`
  text-align: center;
  padding: 30px 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
  border: 1px solid #d9d9d9;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #d9d9d9;
  width: 100%;
`

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  color: #1890ff;
  text-decoration: none;
  transition: color 0.3s ease;
  &:hover { color: #40a9ff; text-decoration: underline; }
  .anticon { margin-right: 6px; font-size: 16px; }
`

function ResultDisplay({ result }) {
  if (!result) {
    return (
      <ResultContainer>
        <Empty description="尚未抽取目的地" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </ResultContainer>
    )
  }

  const stationName = result.name?.zh ?? '未知車站'
  const lines = Array.isArray(result.lines) ? result.lines : []
  const lineSubtitle = lines.map(code => metroLineInfo[code]?.name ?? code).join(' / ')
  const wikiLink = `https://zh.wikipedia.org/wiki/${encodeURIComponent(stationName)}站_(台北捷運)`
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stationName)}+捷運站`

  return (
    <ResultContainer>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ marginBottom: 4, color: '#1890ff' }}>
          <CarOutlined style={{ marginRight: 8 }} />
          「{stationName}」站
        </Title>
        {lineSubtitle && <p style={{ color: 'rgba(0,0,0,0.45)', margin: 0 }}>{lineSubtitle}</p>}
      </div>
      <LinksContainer>
        <StyledLink href={wikiLink} target="_blank" rel="noopener noreferrer">
          <GlobalOutlined /> 維基百科
        </StyledLink>
        <StyledLink href={mapLink} target="_blank" rel="noopener noreferrer">
          <EnvironmentOutlined /> Google Map
        </StyledLink>
      </LinksContainer>
    </ResultContainer>
  )
}

ResultDisplay.propTypes = {
  result: PropTypes.object,
}

export default ResultDisplay
