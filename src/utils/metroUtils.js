// src/utils/metroUtils.js

/**
 * 從捷運資料中隨機抽取一個車站，可根據選擇的線路進行篩選。
 * 特定處理：如果篩選結果僅為 "新北投" 或 "小碧潭" 單一站，則直接返回該站。
 * @param {object} metroData - 包含 stations 陣列的捷運資料物件。
 * @param {string[]} [selectedLines=[]] - 使用者選擇的線路代碼陣列 (例如 ['R', 'G'])。如果為空陣列，則從所有車站中抽取。
 * @returns {object|null} - 隨機抽取的車站物件或 null (如果找不到符合條件的車站)。
 */
export function getRandomMetroStation(metroData, selectedLines = []) {
    // 1. 檢查基本資料有效性
    if (!metroData || !Array.isArray(metroData.stations) || metroData.stations.length === 0) {
      console.warn("捷運資料錯誤、缺少 stations 陣列或為空！");
      return null;
    }
  
    let availableStations = [];
  
    // 2. 判斷是否需要篩選
    if (selectedLines && selectedLines.length > 0) {
      // 需要根據 selectedLines 篩選
      availableStations = metroData.stations.filter(station => {
        const stationLines = Array.isArray(station.lines) ? station.lines : [];
        return stationLines.some(lineCode => selectedLines.includes(lineCode));
      });
  
      // 如果篩選後沒有任何車站符合條件
      if (availableStations.length === 0) {
        console.warn(`在選擇的線路 [${selectedLines.join(', ')}] 上找不到任何車站。`);
        return null;
      }
  
      // --- START: 新增特殊處理邏輯 ---
      // 如果篩選結果只有一個車站
      if (availableStations.length === 1) {
        const singleStation = availableStations[0];
        // 檢查這個車站是否是新北投或小碧潭 (請確認你的 metroData.json 中站名的確是這樣寫)
        // 使用 optional chaining (?.) 確保 name 和 zh 存在
        const stationName = singleStation?.name?.zh;
        if (stationName === '新北投' || stationName === '小碧潭') {
          console.log(`篩選結果為單一特定車站 (${stationName})，直接返回。`);
          return singleStation; // 直接返回這個特定車站
        }
        // 如果是其他單一車站，則繼續往下走進行隨機選取 (結果也會是它自己)
      }
      // --- END: 新增特殊處理邏輯 ---
  
    } else {
      // 不需要篩選，使用全部車站
      availableStations = metroData.stations;
    }
  
    // 再次檢查 (如果一開始資料就為空)
    if (availableStations.length === 0) {
        return null;
    }
  
    // 3. 從篩選後 (或全部，或非特定單一站) 的可用車站列表中隨機抽取
    const randomIndex = Math.floor(Math.random() * availableStations.length);
    return availableStations[randomIndex];
  }