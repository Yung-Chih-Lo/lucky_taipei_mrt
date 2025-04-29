// src/components/ResultDisplay.jsx (MRT Version - Final)

import React, { useState, useEffect } from 'react';
import { Typography, Empty } from 'antd';
import { GlobalOutlined, EnvironmentOutlined, CarOutlined} from '@ant-design/icons';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { metroLineInfo } from '../constants/metroInfo';

const { Title, Text } = Typography;

const ResultContainer = styled.div`
  text-align: center;
  padding: 30px 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
  border: 1px solid #d9d9d9;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StationInfo = styled.div`
  margin-bottom: ${props => props.$isAnimating ? '0' : '24px'};
  transition: margin-bottom 0.5s ease-in-out;
  min-height: 60px;
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #d9d9d9;
  width: 100%;
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  color: #1890ff;
  text-decoration: none;
  transition: color 0.3s ease;
  &:hover { color: #40a9ff; text-decoration: underline; }
  .anticon { margin-right: 6px; font-size: 16px; }
`;

// --- 動畫輔助函數 (只處理 Metro data) ---
const pickRandomStationNameForAnimation = (metroData) => {
  if (!metroData?.stations?.length) {
    return "讀取中...";
  }
  const stations = metroData.stations;
  const randomIndex = Math.floor(Math.random() * stations.length);
  return stations[randomIndex]?.name?.zh || "捷運站";
};


// --- Props 只需 result 和 allStationsData ---
function ResultDisplay({ result, allStationsData }) { // allStationsData 固定是 metroData
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayStationName, setDisplayStationName] = useState('');

  useEffect(() => {
    // 動畫邏輯保持不變，使用簡化後的 Helper
    let intervalId = null;
    let timeoutId = null;
    if (result && allStationsData) {
      setIsAnimating(true);
      setDisplayStationName(pickRandomStationNameForAnimation(allStationsData));
      intervalId = setInterval(() => {
        setDisplayStationName(pickRandomStationNameForAnimation(allStationsData));
      }, 80);
      const animationDuration = 2000;
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        setIsAnimating(false);
        const finalName = result.name?.zh;
        setDisplayStationName(finalName || '未知車站');
      }, animationDuration);
    } else {
      setIsAnimating(false);
      setDisplayStationName('');
    }
    return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
  }, [result, allStationsData]); // 依賴項簡化

  // Empty 狀態
  if (!result && !isAnimating) {
    return (
      <ResultContainer>
        <Empty description="尚未抽取目的地" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </ResultContainer>
    );
  }

  // --- 提取結果資訊 (固定 Metro 邏輯) ---
  let stationName = '';
  let stationSubtitle = ''; // 將顯示完整線路名稱
  let wikiLink = '#';
  let mapLink = '#';

  if (!isAnimating && result) {
      stationName = result.name?.zh;
      // *** 修改這裡：將線路代碼轉換為完整名稱 ***
      const linesArray = Array.isArray(result.lines) ? result.lines : [];
      stationSubtitle = linesArray
          .map(code => metroLineInfo[code]?.name || code) // 查找名稱，找不到則顯示代碼
          .join(' / '); // 使用 ' / ' 分隔多條線路

      // 產生連結
      if (stationName) {
        wikiLink = `https://zh.wikipedia.org/wiki/${encodeURIComponent(stationName)}站_(台北捷運)`;
        mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stationName)}+捷運站`; // 使用標準 Google Maps 搜尋 URL
      }
  }

  return (
    <ResultContainer>
      <StationInfo $isAnimating={isAnimating}>
        <Title level={2} style={{ marginBottom: '4px', color: '#1890ff' }}>
            {/* 固定顯示 Metro 圖標 */}
            {!isAnimating && <CarOutlined style={{ marginRight: '8px' }} />}
            「{displayStationName}」
            {!isAnimating && '站'}
        </Title>
        {/* 副標題顯示完整線路名稱 */}
        {!isAnimating && stationSubtitle && <Text type="secondary">{stationSubtitle}</Text>}
      </StationInfo>

      {/* 連結 */}
      {!isAnimating && result && (
        <LinksContainer>
          {stationName && wikiLink !== '#' && (
            <StyledLink href={wikiLink} target="_blank" rel="noopener noreferrer">
              <GlobalOutlined /> 維基百科
            </StyledLink>
          )}
          {stationName && mapLink !== '#' && (
             <StyledLink href={mapLink} target="_blank" rel="noopener noreferrer">
               <EnvironmentOutlined /> Google Map
             </StyledLink>
           )}
        </LinksContainer>
      )}
    </ResultContainer>
  );
}

// --- PropTypes 更新 ---
ResultDisplay.propTypes = {
    result: PropTypes.object, // Metro Station Object
    allStationsData: PropTypes.object, // Metro Data
};

export default ResultDisplay;