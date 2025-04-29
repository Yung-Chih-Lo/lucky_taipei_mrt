// src/components/MetroMap.jsx (重構成 Functional Component)

import React from 'react';
import PropTypes from 'prop-types';
import MetroStation from './MetroStation.jsx'; // 確保引入
import MetroData from '../data/metroData.json'; // 確保路徑正確

// --- 將常數移到元件外部 ---
const lineColorMap = {
  'BR': 'brown', 'R': 'red', 'RA': 'pink', 'G': 'green',
  'GA': '#99E64D', 'O': 'orange', 'BL': 'blue', 'Y': '#fadc00' // 確認環狀線代碼
};
const baseRadius = 8; // 基礎半徑 (相對於 viewBox)
const baseStationStrokeWidth = 3; // 基礎站點線寬
const baseConnectionStrokeWidth = 4; // 基礎連接線線寬
const baseFontSize = 10; // 基礎字體大小
const dimOpacity = 0.25; // 變暗時的透明度 (可調整 0.1 ~ 0.5 之間)
const dimColor = '#cccccc'; // 變暗時的顏色 (可選，或者只用透明度)

// --- Functional Component ---
function MetroMap({
    bgColor = 'white',
    style = {},
    textStyle = { fill: 'black' },
    showStationName = true,
    // --- 接收 selectedLines ---
    selectedLines = [],
    // --- 保留事件處理 props ---
    onMouseEnterStation = () => {},
    onMouseLeaveStation = () => {},
    onClickStation = () => {},
    // --- userData 相關 (如果需要) ---
    showUserData = false,
    renderUserData = () => null,
}) {

    const svgStyle = {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        background: bgColor,
        ...style,
    };

    // --- 判斷當前是否有線路被選擇 ---
    const hasSelection = selectedLines.length > 0;

    // --- 檢查資料有效性 ---
    if (!MetroData?.stations || !MetroData?.connections) {
        console.error("捷運資料 (MetroData) 缺失或格式錯誤!", MetroData);
        return <div>捷運資料載入錯誤</div>;
    }

    // --- 渲染 Connections (線路) ---
    const connections = (MetroData.connections || []).map((connection, i) => {
        const lineCode = connection.line;
        // 判斷此線路是否為當前選中線路之一
        const isActive = hasSelection && selectedLines.includes(lineCode);
        // 如果沒有選擇任何線路 (hasSelection=false)，所有線路都變暗
        // 如果有選擇線路 (hasSelection=true)，則只有 active 的線路變亮
        const opacity = hasSelection ? (isActive ? 1 : dimOpacity) : dimOpacity;
        const strokeColor = lineColorMap[lineCode] || dimColor; // 使用線路顏色或預設暗色

        return (
            <path
                key={`conn-${lineCode}-${i}`}
                stroke={strokeColor}
                strokeOpacity={opacity} // *** 應用透明度 ***
                fill="none"
                strokeWidth={baseConnectionStrokeWidth} // 使用基礎寬度
                style={{ transition: 'stroke-opacity 0.3s ease' }} // 添加過渡效果
                d={(connection.path || []).reduce((acc, cmd) => {
                    const coordsArray = Array.isArray(cmd.coordinates) ? cmd.coordinates : [];
                    const coordinates = coordsArray.map(x => typeof x === 'number' ? x : 0).join(',');
                    const command = typeof cmd.command === 'string' ? cmd.command : '';
                    return `${acc} ${command}${coordinates}`;
                }, '')}
             />
        );
    });

    // --- 渲染 Stations ---
    const stations = (MetroData.stations || []).map((station, i) => {
        const stationLines = Array.isArray(station.lines) ? station.lines : [];
        // 判斷此站是否在任何一條被選中的線路上
        const isActive = hasSelection && stationLines.some(line => selectedLines.includes(line));
        // 計算透明度
        const opacity = hasSelection ? (isActive ? 1 : dimOpacity) : dimOpacity;
        // 決定要顯示的顏色 (如果 active，只顯示選中線路的顏色；否則顯示原始顏色)
        let displayLineColors = stationLines.map(line => lineColorMap[line] || dimColor);
        if (hasSelection && isActive) {
            // 只保留被選中線路的顏色
            displayLineColors = stationLines
                .filter(line => selectedLines.includes(line))
                .map(line => lineColorMap[line] || dimColor);
             // 如果過濾後沒有顏色（例如轉乘站，但只選了其中一條線），至少給個預設
             if (displayLineColors.length === 0) displayLineColors = [dimColor];
        } else if (!hasSelection) {
             // 如果沒選，可以用 dimColor 或原始顏色但低透明度
             // displayLineColors = [dimColor]; // 選項1: 全部變灰
             // 選項2: 保留原色，靠 opacity 變暗 (下面會做)
        }


        // 傳遞給 MetroStation 的 props
        const stationProps = {
            key: `station-${station.id ?? i}`,
            cx: station.center?.x ?? 0,
            cy: station.center?.y ?? 0,
            r: baseRadius,
            strokeWidth: baseStationStrokeWidth,
            fill: bgColor,
            lineColors: displayLineColors, // 傳遞計算後的顏色
            opacity: opacity,           // *** 傳遞透明度 ***
            // 傳遞原始 station data 給事件處理器
            originalStation: station,
            onMouseEnterStation: onMouseEnterStation,
            onMouseLeaveStation: onMouseLeaveStation,
            onClickStation: onClickStation,
        };

        return <MetroStation {...stationProps} />;
    });

    // --- 渲染 Station Names ---
    let stationNames;
    if (showStationName) {
        stationNames = (MetroData.stations || []).map((station, i) => {
            const stationLines = Array.isArray(station.lines) ? station.lines : [];
            const isActive = hasSelection && stationLines.some(line => selectedLines.includes(line));
            const opacity = hasSelection ? (isActive ? 1 : dimOpacity) : dimOpacity;

            return (
                <text
                    key={`name-${station.id ?? i}`}
                    x={station.name?.pos?.x ?? 0}
                    y={station.name?.pos?.y ?? 0}
                    fontSize={baseFontSize}
                    style={textStyle} // 應用基礎文字樣式
                    fillOpacity={opacity} // *** 應用透明度 ***
                    dominantBaseline="middle"
                    textAnchor={station.name?.pos?.anchor || 'start'}
                    pointerEvents="none" // 避免文字阻擋滑鼠事件
                    sx={{ transition: 'fill-opacity 0.3s ease' }} // 添加過渡效果
                >
                    {station.name?.zh || ''}
                </text>
            );
        });
    }

    // --- UserData (如果需要，也要加上類似的透明度邏輯) ---
    let userData = null;
    // ...

    // --- 返回 SVG ---
    return (
        <svg
            style={svgStyle}
            viewBox="0 0 800 900"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* 調整渲染順序，讓亮的元素在上面 */}
            {/* 先畫暗的線條 */}
            <g>{connections.filter(c => parseFloat(c.props.strokeOpacity) < 1)}</g>
            {/* 再畫暗的站點 */}
            <g>{stations.filter(s => s.props.opacity < 1)}</g>
            {/* 再畫亮的線條 */}
            <g>{connections.filter(c => parseFloat(c.props.strokeOpacity) === 1)}</g>
            {/* 再畫亮的站點 */}
            <g>{stations.filter(s => s.props.opacity === 1)}</g>
            {/* 最後畫文字 */}
            <g>{stationNames}</g>
            {/* {userData} */}
        </svg>
    );
}

// --- PropTypes (新增 selectedLines) ---
MetroMap.propTypes = {
    bgColor: PropTypes.string,
    style: PropTypes.object,
    textStyle: PropTypes.object,
    showStationName: PropTypes.bool,
    selectedLines: PropTypes.arrayOf(PropTypes.string), // *** 新增 ***
    onMouseEnterStation: PropTypes.func,
    onMouseLeaveStation: PropTypes.func,
    onClickStation: PropTypes.func,
    showUserData: PropTypes.bool,
    renderUserData: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.func)]),
};

export default MetroMap;