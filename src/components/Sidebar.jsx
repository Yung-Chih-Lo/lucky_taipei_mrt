// src/components/Sidebar.jsx (MRT Only, Single Column Layout)

import React from 'react';
import { Checkbox, Button, Divider, Typography } from 'antd';
import { SwapOutlined } from '@ant-design/icons'; //保留捷運相關圖標
import styled from 'styled-components';
import PropTypes from 'prop-types';

const { Text, Title } = Typography;

// --- Styled Components ---
const SidebarWrapper = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const TitleContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const SubtitleText = styled(Text)`
  display: block;
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 0.9em;
`;

const TextWithAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  & > .ant-typography {
    margin-bottom: 0;
    margin-right: 8px;
  }
`;

const ButtonGroup = styled.div`
  margin-top: 0;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
`;

// 新增：用於包裹 Checkbox 列表並使其滾動的容器
const CheckboxListContainer = styled.div`
  flex-grow: 1; // 佔據剩餘空間
  overflow-y: auto; // 超出時顯示滾動條
  padding-right: 8px; // 給滾動條留點空間
  margin-bottom: 16px; // 與下方分隔線的間距
`;

const StyledDivider = styled(Divider)`
  margin: 0 0 16px 0; // 調整 Divider 上下間距
`;

const MainButtonWrapper = styled.div`
  padding: 0;
  margin-top: auto; // 推到底部
`;

// --- Sidebar Props ---
function Sidebar({
    selectedLines = [],
    onLineChange,
    metroLineCodes = [],
    metroLineInfo = {},
    onRandomPick,
    isPickButtonDisabled
}) {

  // --- 線路選擇 Handler ---
  const handleSelectAllLines = () => onLineChange(metroLineCodes);
  const handleDeselectAllLines = () => onLineChange([]);
  const handleLineGroupChange = (checkedValues) => onLineChange(checkedValues);

  // --- 計算按鈕禁用狀態 ---
  const isSelectAllLinesDisabled = selectedLines.length === metroLineCodes.length;
  const isDeselectAllLinesDisabled = selectedLines.length === 0;

  // --- 建立線路選項 ---
  const metroLineOptions = metroLineCodes.map(code => ({
      label: metroLineInfo[code]?.name || code,
      value: code,
      lineColor: metroLineInfo[code]?.color || '#cccccc'
  }));

  return (
    <SidebarWrapper>
      {/* 標題 */}
      <TitleContainer>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          隨機捷運 GO！ 🚇
        </Title>
        <SubtitleText>選擇線路，尋找你的下一站</SubtitleText>
      </TitleContainer>

      {/* 線路選擇 */}
      <>
        <TextWithAction>
          <Text strong>選擇想搭的線路：</Text>
        </TextWithAction>

        <ButtonGroup>
           <Button type="link" size="small" onClick={handleSelectAllLines} disabled={isSelectAllLinesDisabled}>全選</Button>
           <Button type="link" size="small" onClick={handleDeselectAllLines} disabled={isDeselectAllLinesDisabled}>全部取消</Button>
        </ButtonGroup>

        {/* --- 修改為垂直列表佈局 --- */}
        <CheckboxListContainer>
           <Checkbox.Group
               style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} // 改為 flex column，增加間距
               value={selectedLines}
               onChange={handleLineGroupChange}
           >
               {metroLineOptions.map(option => (
                   <Checkbox key={option.value} value={option.value}>
                       {/* 顏色標記 */}
                       <span style={{
                           display: 'inline-block',
                           width: '12px', // 微調大小
                           height: '12px',
                           backgroundColor: option.lineColor,
                           borderRadius: '50%',
                           marginRight: '8px', // 增加間距
                           verticalAlign: 'middle',
                           boxShadow: '0 0 1px rgba(0,0,0,0.5)', // 可選：加點陰影
                           border: '1px solid rgba(0,0,0,0.1)'   // 可選：加點邊框
                       }}></span>
                       {option.label}
                   </Checkbox>
               ))}
           </Checkbox.Group>
        </CheckboxListContainer>
        {/* --- 垂直列表結束 --- */}

        <StyledDivider />
      </>

      {/* 抽取按鈕 */}
      <MainButtonWrapper>
         <Button
           type="primary"
           block
           size="large"
           onClick={onRandomPick}
           disabled={isPickButtonDisabled}
           icon={<SwapOutlined />}
         >
           抽取幸運捷運站！
         </Button>
      </MainButtonWrapper>

    </SidebarWrapper>
  );
}

// Props 類型定義
Sidebar.propTypes = {
    selectedLines: PropTypes.arrayOf(PropTypes.string),
    onLineChange: PropTypes.func,
    metroLineCodes: PropTypes.arrayOf(PropTypes.string),
    metroLineInfo: PropTypes.object,
    onRandomPick: PropTypes.func,
    isPickButtonDisabled: PropTypes.bool,
};

export default Sidebar;