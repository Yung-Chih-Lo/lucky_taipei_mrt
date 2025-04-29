// src/App.jsx (MRT Version)

import React, { useState, useRef } from 'react'; 
import { Typography, Modal } from 'antd';
import styled from 'styled-components';
import Sidebar from './components/Sidebar'; 
import MetroMap from './components/MetroMap.jsx'; 
import ResultDisplay from './components/ResultDisplay'; 
import { getRandomMetroStation } from './utils/metroUtils'; 
import metroData from './data/metroData.json'; 
import { metroLineInfo, allMetroLineCodes } from './constants/metroInfo';

const { Title } = Typography;
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: row;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SidebarArea = styled.div`
  background-color: #fff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.08);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  width: 280px;
  @media (max-width: 768px) {
    width: 100%; height: auto; box-shadow: none;
    border-bottom: 1px solid #d9d9d9; order: 2;
  }
`;

const MainArea = styled.div`
  flex-grow: 1;
  padding: 24px;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    padding: 16px; order: 1;
  }
`;

// 可以直接命名為 MapContainer 或保留 MetroMapContainer
const MetroMapContainer = styled.div`
  width: 100%;
  min-height: 300px;
  max-height: 80vh; // 限制容器高度
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  & > svg {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }
`;

// --- Modal 標題 (只保留 Metro) ---
const modalTitles = [ // 直接使用 modalTitles
  '下一班列車開往...', '捷運隨機 GO！', '今天的幸運捷運站？',
  '探索城市節點...',
];



function App() {

  const [selectedLines, setSelectedLines] = useState([]);
  const [randomMetroStation, setRandomMetroStation] = useState(null); 
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [titleIndex, setTitleIndex] = useState(0);


  const handleLineSelectionChange = (selectedLineCodes) => {
    setSelectedLines(selectedLineCodes);
    setRandomMetroStation(null); 
    setIsResultModalVisible(false);
  };


  const handleRandomPick = () => {
    const stationResult = getRandomMetroStation(metroData, selectedLines);

    if (stationResult) {
      setRandomMetroStation(stationResult);
      setTitleIndex(prevIndex => (prevIndex + 1) % modalTitles.length);
      setIsResultModalVisible(true);
    } else {
      console.warn(`無法從選擇的線路抽取到車站!`);
    }
  };

  const handleResultModalClose = () => {
    setIsResultModalVisible(false);
  };

  // --- 計算狀態 ---
  const isPickButtonDisabled = selectedLines.length === 0;
  const currentResult = randomMetroStation;
  const currentAllStationsData = metroData;
  const resultModalTitle = modalTitles[titleIndex];

  return (
    <AppContainer>
      <SidebarArea>
        <Sidebar
          selectedLines={selectedLines}
          onLineChange={handleLineSelectionChange}
          metroLineCodes={allMetroLineCodes}
          metroLineInfo={metroLineInfo} 
          onRandomPick={handleRandomPick}
          isPickButtonDisabled={isPickButtonDisabled}
        />
      </SidebarArea>

      <MainArea>
        <Title level={3} style={{ marginBottom: '24px', color: '#595959', textAlign: 'center' }}>
          台北捷運路網圖
        </Title>
        <MetroMapContainer>
           <MetroMap
             bgColor="#f0f2f5"
             selectedLines={selectedLines}
           />
        </MetroMapContainer>

      </MainArea>

      <Modal
        title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>{resultModalTitle}</Title>}
        open={isResultModalVisible}
        onCancel={handleResultModalClose}
        footer={null}
        centered
      >
        {isResultModalVisible && currentResult && (
          <ResultDisplay
            result={currentResult}
            resultType='metro'    
            allStationsData={currentAllStationsData} 
          />
        )}
      </Modal>
    </AppContainer>
  );
}

export default App;