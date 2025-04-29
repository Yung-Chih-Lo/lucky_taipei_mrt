// src/components/MetroStation.jsx (重構成 Functional Component)

import React from 'react';
import PropTypes from 'prop-types';

// --- Functional Component ---
// --- 接收 opacity prop ---
function MetroStation({
    cx, cy, r, strokeWidth, fill, lineColors = [], opacity = 1, // 接收 opacity
    onMouseEnterStation, onMouseLeaveStation, onClickStation,
    // originalStationData // 從 props 接收原始數據 (如果事件處理需要)
}) {

    // 基礎樣式，現在包含 transition
    const baseStyle = {
        strokeWidth: strokeWidth,
        fill: fill,
        transition: 'stroke 0.3s ease, stroke-opacity 0.3s ease, fill-opacity 0.3s ease',
        // 透明度現在應用在外層 group 或直接應用
        // strokeOpacity: opacity,
        // fillOpacity: opacity > dimOpacity ? 1 : 0.5, // Fill 可以稍微不透明
    };

    // 單線站點
    if (lineColors.length === 1) {
        const style = {
            ...baseStyle,
            stroke: lineColors[0], // 使用計算後的顏色
        };
        return (
            // 將透明度應用在元素本身
            <circle
                style={style}
                cx={cx}
                cy={cy}
                r={r}
                opacity={opacity} // *** 應用透明度 ***
                onMouseEnter={onMouseEnterStation}
                onMouseLeave={onMouseLeaveStation}
                onClick={onClickStation}
            />
        );
    }

    // 轉乘站點 (>= 2 線)
    if (lineColors.length >= 2) {
        const color1 = lineColors[0];
        const color2 = lineColors[1];

        // 分別設定兩條弧線的樣式
        const pathStyle1 = { ...baseStyle, stroke: color1 };
        const pathStyle2 = { ...baseStyle, stroke: color2 };

        const d1 = `M ${cx - r},${cy} a ${r},${r} 0 1, 0 ${r * 2}, 0`;
        const d2 = `M ${cx - r},${cy} a ${r},${r} 0 1, 1 ${r * 2}, 0`;
        const clickTargetRadius = r * 1.2; // 稍微放大點擊區域

        return (
            // 將透明度應用在外層 group
            <g opacity={opacity} style={{ transition: 'opacity 0.3s ease' }}>
                <path d={d1} style={pathStyle1} />
                <path d={d2} style={pathStyle2} />
                <circle
                    cx={cx}
                    cy={cy}
                    r={clickTargetRadius}
                    fill="transparent"
                    stroke="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={onMouseEnterStation}
                    onMouseLeave={onMouseLeaveStation}
                    onClick={onClickStation}
                />
            </g>
        );
    }

    return null; // 如果線路數為 0 或異常
}

// --- PropTypes (新增 opacity) ---
MetroStation.propTypes = {
    cx: PropTypes.number,
    cy: PropTypes.number,
    r: PropTypes.number,
    strokeWidth: PropTypes.number,
    fill: PropTypes.string,
    lineColors: PropTypes.array,
    opacity: PropTypes.number, // *** 新增 ***
    onMouseEnterStation: PropTypes.func,
    onMouseLeaveStation: PropTypes.func,
    onClickStation: PropTypes.func,
    // originalStationData: PropTypes.object,
};

export default MetroStation;