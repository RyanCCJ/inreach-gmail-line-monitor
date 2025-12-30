/**
 * line.gs - Line Messaging API Notification Module
 * Responsible for pushing inReach messages to Line Bot
 */

// Line Messaging API Settings
// Please set Script Properties in Apps Script Project Settings:
// LINE_CHANNEL_ACCESS_TOKEN - Line Bot Channel Access Token
// LINE_USER_ID - Target User ID or Group ID to push messages to

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * Get Line Channel Access Token
 * @returns {string} Channel Access Token
 */
function getLineChannelAccessToken() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set. Please add it in Script Properties.');
  }
  return token;
}

/**
 * Get Line Push Target ID (User or Group)
 * @returns {string} User ID or Group ID
 */
function getLineUserId() {
  const userId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');
  if (!userId) {
    throw new Error('LINE_USER_ID not set. Please add it in Script Properties.');
  }
  return userId;
}

/**
 * Format push message
 * @param {Object} data - Message data
 * @returns {string} Formatted message string
 */
function formatLineMessage(data) {
  const timestamp = Utilities.formatDate(
    new Date(data.timestamp), 
    'Asia/Taipei', 
    'yyyy-MM-dd HH:mm:ss'
  );
  
  let message = `inReach: ${data.inreachName}\n\n`;
  message += `Team: ${data.teamName}\n\n`;
  message += `Time: ${timestamp}\n\n`;
  message += `Message:\n${data.messageText}\n\n`;
  
  if (data.exploreLink) {
    message += `Link:\n${data.exploreLink}`;
  }
  
  return message;
}

/**
 * Send notification to Line
 * @param {Object} data - Message data
 * @returns {boolean} Success status
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
      Logger.log(`Line push successful: ${data.inreachName} - ${data.messageText.substring(0, 30)}...`);
      return true;
    } else {
      const responseBody = response.getContentText();
      Logger.log(`Line push failed (${responseCode}): ${responseBody}`);
      return false;
    }
    
  } catch (error) {
    Logger.log(`Error sending Line notification: ${error.message}`);
    return false;
  }
}

/**
 * Test Line Notification
 */
function testLineNotification() {
  const testData = {
    inreachName: 'Test Device',
    teamName: 'Test Team',
    timestamp: new Date(),
    messageText: 'This is a test message',
    exploreLink: 'https://aus.explore.garmin.com/textmessage/txtmsg?extId=test-123'
  };
  
  const result = sendLineNotification(testData);
  Logger.log(`Test result: ${result ? 'Success' : 'Failed'}`);
}
