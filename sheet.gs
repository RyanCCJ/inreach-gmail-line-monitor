/**
 * sheet.gs - Google Sheet 建立與寫入模組
 * 負責建立隊伍分頁並寫入訊息資料
 */

// 分頁標題欄位
const SHEET_HEADERS = ['timestamp', 'inreach_name', 'team_name', 'message_text', 'explore_link', 'gmail_message_id'];

/**
 * 產生分頁名稱
 * @param {string} teamName - 隊伍名稱
 * @param {Date} date - 日期
 * @returns {string} 分頁名稱 (YYYYMMDD_teamName)
 */
function generateSheetName(teamName, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}_${teamName}`;
}

/**
 * 初始化分頁標題列
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 分頁物件
 */
function initializeSheetHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  headerRange.setValues([SHEET_HEADERS]);
  
  // 設定標題列樣式
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('white');
  
  // 凍結標題列
  sheet.setFrozenRows(1);
  
  // 調整欄寬
  sheet.setColumnWidth(1, 180); // timestamp
  sheet.setColumnWidth(2, 120); // inreach_name
  sheet.setColumnWidth(3, 120); // team_name
  sheet.setColumnWidth(4, 400); // message_text
  sheet.setColumnWidth(5, 350); // explore_link
  sheet.setColumnWidth(6, 200); // gmail_message_id
  
  Logger.log('已初始化分頁標題列');
}

/**
 * 取得或建立隊伍分頁
 * @param {string} teamName - 隊伍名稱
 * @param {Date} date - 日期（用於命名）
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} 分頁物件
 */
function getOrCreateTeamSheet(teamName, date) {
  const spreadsheet = getSpreadsheet();
  const sheetName = generateSheetName(teamName, date);
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log(`建立新分頁: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheetHeaders(sheet);
  }
  
  return sheet;
}

/**
 * 檢查訊息是否已存在（避免重複寫入）
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 分頁物件
 * @param {string} messageId - Gmail 訊息 ID
 * @returns {boolean} 是否已存在
 */
function isMessageExists(sheet, messageId) {
  const data = sheet.getDataRange().getValues();
  const messageIdColIndex = SHEET_HEADERS.indexOf('gmail_message_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][messageIdColIndex] === messageId) {
      return true;
    }
  }
  
  return false;
}

/**
 * 寫入訊息資料到分頁
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - 分頁物件
 * @param {Object} data - 訊息資料
 * @returns {boolean} 是否成功寫入
 */
function writeMessageToSheet(sheet, data) {
  // 檢查是否已存在
  if (isMessageExists(sheet, data.messageId)) {
    Logger.log(`訊息 ${data.messageId} 已存在，跳過`);
    return false;
  }
  
  // 準備資料列
  const row = [
    data.timestamp,
    data.inreachName,
    data.teamName,
    data.messageText,
    data.exploreLink,
    data.messageId
  ];
  
  // 寫入到最後一列
  sheet.appendRow(row);
  
  Logger.log(`已寫入訊息到分頁: ${data.inreachName} - ${data.messageText.substring(0, 30)}...`);
  return true;
}

/**
 * 處理並寫入訊息
 * @param {Object} parsedMessage - 解析後的訊息
 * @param {Object} config - Config 設定
 * @returns {boolean} 是否成功寫入
 */
function processAndWriteMessage(parsedMessage, config) {
  const sheet = getOrCreateTeamSheet(config.teamName, parsedMessage.timestamp);
  
  const data = {
    timestamp: parsedMessage.timestamp,
    inreachName: parsedMessage.inreachName,
    teamName: config.teamName,
    messageText: parsedMessage.messageText,
    exploreLink: parsedMessage.exploreLink,
    messageId: parsedMessage.messageId
  };
  
  return writeMessageToSheet(sheet, data);
}
