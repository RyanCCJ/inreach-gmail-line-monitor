/**
 * line.gs - Line Messaging API 推播模組
 * 負責將 inReach 訊息推送到 Line Bot
 */

// Line Messaging API 設定
// 請在 Apps Script 專案設定中設定 Script Properties：
// LINE_CHANNEL_ACCESS_TOKEN - Line Bot 的 Channel Access Token
// LINE_USER_ID - 要推送的使用者或群組 ID

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * 取得 Line Channel Access Token
 * @returns {string} Channel Access Token
 */
function getLineChannelAccessToken() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) {
    throw new Error('未設定 LINE_CHANNEL_ACCESS_TOKEN，請在專案設定中新增 Script Properties');
  }
  return token;
}

/**
 * 取得 Line 推送目標 ID（使用者或群組）
 * @returns {string} User ID 或 Group ID
 */
function getLineUserId() {
  const userId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');
  if (!userId) {
    throw new Error('未設定 LINE_USER_ID，請在專案設定中新增 Script Properties');
  }
  return userId;
}

/**
 * 格式化推播訊息
 * @param {Object} data - 訊息資料
 * @returns {string} 格式化後的訊息
 */
function formatLineMessage(data) {
  const timestamp = Utilities.formatDate(
    new Date(data.timestamp), 
    'Asia/Taipei', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  let message = `inReach：${data.inreachName}\n\n`;
  message += `Team：${data.teamName}\n\n`;
  message += `Time: ${timestamp}\n\n`;
  message += `Message：\n${data.messageText}\n\n`;
  
  if (data.exploreLink) {
    message += `Link：\n${data.exploreLink}`;
  }
  
  return message;
}

/**
 * 推送訊息到 Line
 * @param {Object} data - 訊息資料
 * @returns {boolean} 是否成功
 */
function sendLineNotification(data) {
  try {
    const token = getLineChannelAccessToken();
    const userId = getLineUserId();
    const message = formatLineMessage(data);
    
    const payload = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(LINE_API_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      Logger.log(`Line 推播成功: ${data.inreachName} - ${data.messageText.substring(0, 30)}...`);
      return true;
    } else {
      const responseBody = response.getContentText();
      Logger.log(`Line 推播失敗 (${responseCode}): ${responseBody}`);
      return false;
    }
    
  } catch (error) {
    Logger.log(`Line 推播發生錯誤: ${error.message}`);
    return false;
  }
}

/**
 * 測試 Line 推播功能
 */
function testLineNotification() {
  const testData = {
    inreachName: '測試裝置',
    teamName: '測試隊伍',
    timestamp: new Date(),
    messageText: '這是一則測試訊息',
    exploreLink: 'https://aus.explore.garmin.com/textmessage/txtmsg?extId=test-123'
  };
  
  const result = sendLineNotification(testData);
  Logger.log(`測試結果: ${result ? '成功' : '失敗'}`);
}
