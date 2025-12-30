/**
 * webapp.gs - Web App 服務端模組
 * 提供管理介面的 API
 */

/**
 * Web App 入口點 - 返回 HTML 頁面
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('inReach Gmail Monitor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== Config CRUD API ====================

/**
 * 取得所有 Config（供前端呼叫）
 * @returns {Object} 包含 configs 和 activeCount
 */
function getConfigsForWeb() {
  const configs = getAllConfigs();
  const now = new Date();
  
  // 為每個 config 加上活動狀態
  const configsWithStatus = configs.map(config => {
    const startTime = new Date(config.startTime);
    const endTime = new Date(config.endTime);
    const isInTimeRange = now >= startTime && now <= endTime;
    const isActive = config.active && isInTimeRange;
    
    return {
      ...config,
      startTime: formatDateForInput(config.startTime),
      endTime: formatDateForInput(config.endTime),
      isActive: isActive
    };
  });
  
  const activeCount = configsWithStatus.filter(c => c.isActive).length;
  
  return {
    configs: configsWithStatus,
    activeCount: activeCount
  };
}

/**
 * 格式化日期為 input datetime-local 格式
 */
function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 新增設定
 * @param {Object} data - 設定資料
 * @returns {Object} 結果
 */
function addConfig(data) {
  try {
    const sheet = getConfigSheet();
    const nextId = getNextConfigId();
    
    const row = [
      nextId,
      data.inreachName,
      data.teamName,
      new Date(data.startTime),
      new Date(data.endTime),
      data.active === true || data.active === 'true'
    ];
    
    sheet.appendRow(row);
    
    return { success: true, id: nextId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 更新設定
 * @param {Object} data - 設定資料（需包含 id）
 * @returns {Object} 結果
 */
function updateConfig(data) {
  try {
    const sheet = getConfigSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][CONFIG_COLUMNS.ID] == data.id) {
        const rowIndex = i + 1;
        
        sheet.getRange(rowIndex, CONFIG_COLUMNS.INREACH_NAME + 1).setValue(data.inreachName);
        sheet.getRange(rowIndex, CONFIG_COLUMNS.TEAM_NAME + 1).setValue(data.teamName);
        sheet.getRange(rowIndex, CONFIG_COLUMNS.START_TIME + 1).setValue(new Date(data.startTime));
        sheet.getRange(rowIndex, CONFIG_COLUMNS.END_TIME + 1).setValue(new Date(data.endTime));
        sheet.getRange(rowIndex, CONFIG_COLUMNS.ACTIVE + 1).setValue(data.active === true || data.active === 'true');
        
        return { success: true };
      }
    }
    
    return { success: false, error: '找不到指定的設定' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 刪除設定
 * @param {number} id - 設定 ID
 * @returns {Object} 結果
 */
function deleteConfig(id) {
  try {
    const sheet = getConfigSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][CONFIG_COLUMNS.ID] == id) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    
    return { success: false, error: '找不到指定的設定' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 取得下一個可用 ID
 * @returns {number} 下一個 ID
 */
function getNextConfigId() {
  const configs = getAllConfigs();
  if (configs.length === 0) return 1;
  
  const maxId = Math.max(...configs.map(c => Number(c.id) || 0));
  return maxId + 1;
}

// ==================== Trigger API ====================

/**
 * 取得目前掃描頻率（分鐘）
 * @returns {number|null} 頻率或 null
 */
function getScanFrequency() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      // 無法直接取得頻率，返回預設值
      return 5;
    }
  }
  
  return null;
}

/**
 * 設定掃描頻率
 * @param {number} minutes - 分鐘數（1, 5, 10, 15, 30）
 * @returns {Object} 結果
 */
function setScanFrequency(minutes) {
  try {
    // 先移除現有觸發器
    removeTrigger();
    
    // 建立新觸發器
    ScriptApp.newTrigger('scanInreachMails')
      .timeBased()
      .everyMinutes(minutes)
      .create();
    
    return { success: true, frequency: minutes };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 取得觸發器狀態
 * @returns {Object} 狀態資訊
 */
function getTriggerStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      return {
        enabled: true,
        frequency: 5 // 預設顯示
      };
    }
  }
  
  return {
    enabled: false,
    frequency: null
  };
}
