import React, { useState } from 'react'
import { Typography, Modal } from 'antd'
import styled from 'styled-components'
import Sidebar from '../components/Sidebar.jsx'
import LeafletMap from '../components/LeafletMap.jsx'
import ResultDisplay from '../components/ResultDisplay.jsx'
import { getRandomMetroStation } from '../utils/metroUtils.js'
import { getActiveMetroData } from '../utils/metroDataLoader.js'
import { allMetroLineCodes, metroLineInfo } from '../constants/metroInfo.js'

const { Title } = Typography

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: row;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SidebarArea = styled.div`
  background-color: #fff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  width: 280px;
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    box-shadow: none;
    border-bottom: 1px solid #d9d9d9;
    order: 2;
  }
`

const MainArea = styled.div`
  flex-grow: 1;
  padding: 24px;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    padding: 16px;
    order: 1;
  }
`

const MapContainer = styled.div`
  width: 100%;
  flex: 1;
  min-height: 400px;
  max-height: 80vh;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
`

const modalTitles = [
  '下一班列車開往...',
  '捷運隨機 GO！',
  '今天的幸運捷運站？',
  '探索城市節點...',
]

function MainPage() {
  const [metroData] = useState(() => getActiveMetroData())
  const [selectedLines, setSelectedLines] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationStations, setAnimationStations] = useState([])
  const [lotteryTarget, setLotteryTarget] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [titleIndex, setTitleIndex] = useState(0)

  const handleLineChange = (lines) => {
    setSelectedLines(lines)
    setLotteryTarget(null)
    setIsModalVisible(false)
  }

  const handleRandomPick = () => {
    const finalStation = getRandomMetroStation(metroData, selectedLines)
    if (!finalStation) return

    const pool = metroData.stations.filter(s =>
      selectedLines.length === 0 || s.lines?.some(l => selectedLines.includes(l))
    )
    const intermediates = Array.from({ length: 12 }, () =>
      pool[Math.floor(Math.random() * pool.length)]
    )

    setAnimationStations([...intermediates, finalStation])
    setLotteryTarget(finalStation)
    setTitleIndex(prev => (prev + 1) % modalTitles.length)
    setIsAnimating(true)
  }

  const handleAnimationEnd = () => {
    setIsAnimating(false)
    setIsModalVisible(true)
  }

  return (
    <AppContainer>
      <SidebarArea>
        <Sidebar
          selectedLines={selectedLines}
          onLineChange={handleLineChange}
          metroLineCodes={allMetroLineCodes}
          metroLineInfo={metroLineInfo}
          onRandomPick={handleRandomPick}
          isPickButtonDisabled={selectedLines.length === 0}
          isAnimating={isAnimating}
        />
      </SidebarArea>

      <MainArea>
        <Title level={3} style={{ marginBottom: '16px', color: '#595959', textAlign: 'center' }}>
          台北捷運路網圖
        </Title>
        <MapContainer>
          <LeafletMap
            metroData={metroData}
            selectedLines={selectedLines}
            isAnimating={isAnimating}
            animationStations={animationStations}
            lotteryTarget={lotteryTarget}
            onAnimationEnd={handleAnimationEnd}
          />
        </MapContainer>
      </MainArea>

      <Modal
        title={
          <Title level={4} style={{ textAlign: 'center', margin: 0 }}>
            {modalTitles[titleIndex]}
          </Title>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        {isModalVisible && lotteryTarget && (
          <ResultDisplay result={lotteryTarget} />
        )}
      </Modal>
    </AppContainer>
  )
}

export default MainPage
