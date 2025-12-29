/**
 * config.gs - Config Sheet 讀取模組
 * 負責讀取 Config 分頁中的 inReach 設定
 */

// Google Sheet 名稱
const SPREADSHEET_NAME = 'inReach_monitor';
const CONFIG_SHEET_NAME = 'Config';

// Config 欄位索引 (0-based)
const CONFIG_COLUMNS = {
  ID: 0,
  INREACH_NAME: 1,
  TEAM_NAME: 2,
  START_TIME: 3,
  END_TIME: 4,
  ACTIVE: 5
};

/**
 * 取得 inReach_monitor 試算表
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} 試算表物件
 */
function getSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (!files.hasNext()) {
    throw new Error(`找不到名為 "${SPREADSHEET_NAME}" 的試算表`);
  }
  const file = files.next();
  return SpreadsheetApp.open(file);
}

/**
 * 取得 Config 分頁
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Config 分頁
 */
function getConfigSheet() {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    throw new Error(`找不到名為 "${CONFIG_SHEET_NAME}" 的分頁`);
  }
  return sheet;
}

/**
 * 讀取所有 Config 資料
 * @returns {Array<Object>} Config 物件陣列
 */
function getAllConfigs() {
  const sheet = getConfigSheet();
  const data = sheet.getDataRange().getValues();
  
  // 跳過標題列
  const configs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[CONFIG_COLUMNS.ID]) { // 確保有 ID
      configs.push({
        id: row[CONFIG_COLUMNS.ID],
        inreachName: row[CONFIG_COLUMNS.INREACH_NAME],
        teamName: row[CONFIG_COLUMNS.TEAM_NAME],
        startTime: row[CONFIG_COLUMNS.START_TIME],
        endTime: row[CONFIG_COLUMNS.END_TIME],
        active: row[CONFIG_COLUMNS.ACTIVE] === true || row[CONFIG_COLUMNS.ACTIVE] === 'TRUE'
      });
    }
  }
  
  return configs;
}

/**
 * 取得所有啟用且在時間範圍內的設定
 * @returns {Array<Object>} 符合條件的 Config 物件陣列
 */
function getActiveInreachConfigs() {
  const configs = getAllConfigs();
  const now = new Date();
  
  return configs.filter(config => {
    if (!config.active) return false;
    
    // 檢查時間範圍
    const startTime = new Date(config.startTime);
    const endTime = new Date(config.endTime);
    
    return now >= startTime && now <= endTime;
  });
}

/**
 * 根據 inReach 名稱找到對應的設定
 * @param {string} inreachName - inReach 名稱
 * @returns {Object|null} Config 物件或 null
 */
function findConfigByInreachName(inreachName) {
  const activeConfigs = getActiveInreachConfigs();
  
  return activeConfigs.find(config => config.inreachName === inreachName) || null;
}
