/**
 * gmail.gs - Gmail 搜尋與標籤管理模組
 * 負責搜尋 inReach 郵件並管理處理狀態標籤
 */

// Gmail 標籤名稱
const PROCESSED_LABEL_NAME = 'inreach_processed';

/**
 * 搜尋未處理的 inReach 郵件
 * @returns {Array<GoogleAppsScript.Gmail.GmailThread>} Gmail thread 陣列
 */
function searchUnprocessedInreachEmails() {
  // 搜尋條件：Subject 包含 "的 inReach 訊息" 且沒有 inreach_processed 標籤
  // 或者從寄件人搜尋包含 "inreach@garmin.com"
  const searchQuery = '(subject:"的 inReach 訊息" OR from:inreach@garmin.com) -label:' + PROCESSED_LABEL_NAME;
  
  try {
    const threads = GmailApp.search(searchQuery);
    Logger.log(`找到 ${threads.length} 個未處理的 inReach 郵件 thread`);
    return threads;
  } catch (error) {
    Logger.log(`搜尋郵件時發生錯誤: ${error.message}`);
    return [];
  }
}

/**
 * 取得或建立 Gmail 標籤
 * @param {string} labelName - 標籤名稱
 * @returns {GoogleAppsScript.Gmail.GmailLabel} Gmail 標籤物件
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  
  if (!label) {
    Logger.log(`建立新標籤: ${labelName}`);
    label = GmailApp.createLabel(labelName);
  }
  
  return label;
}

/**
 * 將 thread 標記為已處理
 * @param {GoogleAppsScript.Gmail.GmailThread} thread - Gmail thread
 */
function markThreadAsProcessed(thread) {
  const label = getOrCreateLabel(PROCESSED_LABEL_NAME);
  thread.addLabel(label);
  Logger.log(`已將 thread "${thread.getFirstMessageSubject()}" 標記為已處理`);
}

/**
 * 從 thread 中取得所有訊息
 * @param {GoogleAppsScript.Gmail.GmailThread} thread - Gmail thread
 * @returns {Array<GoogleAppsScript.Gmail.GmailMessage>} Gmail 訊息陣列
 */
function getMessagesFromThread(thread) {
  return thread.getMessages();
}
