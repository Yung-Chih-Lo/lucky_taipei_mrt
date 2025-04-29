// src/constants/metroInfo.js

export const metroLineInfo = {
    'BR': { name: '文湖線', color: 'brown' },
    'R':  { name: '淡水信義線', color: 'red' },
    'G':  { name: '松山新店線', color: 'green' },
    'O':  { name: '中和新蘆線', color: 'orange' },
    'BL': { name: '板南線', color: 'blue' },
    'Y':  { name: '環狀線', color: '#fadc00' }, 
    'RA': { name: '新北投支線', color: 'pink' },
    'GA': { name: '小碧潭支線', color: '#99E64D' },
    // 如果還有其他線路，請加入
  };
  
  // 同時匯出所有線路代碼，方便使用
  export const allMetroLineCodes = Object.keys(metroLineInfo);