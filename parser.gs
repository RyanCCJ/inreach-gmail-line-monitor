/**
 * parser.gs - 信件內容解析模組
 * 負責解析 inReach 郵件的 Subject 和 Body
 */

// Subject 解析正則表達式
const SUBJECT_REGEX = /來自 (.+?) 的 inReach 訊息/;

// 內文結束標記（使用者訊息在此之前）
const MESSAGE_END_MARKERS = [
  '檢視其位置',
  'View the location',
  'View their location'
];

// Garmin Explore 連結正則表達式
const EXPLORE_LINK_REGEX = /https?:\/\/[a-z]+\.explore\.garmin\.com\/textmessage\/txtmsg\?[^\s]+/gi;

/**
 * 從 Subject 解析 inReach 名稱
 * @param {string} subject - 郵件主旨
 * @returns {string|null} inReach 名稱或 null
 */
function parseInreachName(subject) {
  const match = subject.match(SUBJECT_REGEX);
  
  if (match && match[1]) {
    const name = match[1].trim();
    Logger.log(`從 Subject 解析到 inReach 名稱: ${name}`);
    return name;
  }
  
  // 嘗試英文格式: "inReach message from XXXX"
  const englishMatch = subject.match(/inReach message from (.+)/i);
  if (englishMatch && englishMatch[1]) {
    const name = englishMatch[1].trim();
    Logger.log(`從 Subject (英文格式) 解析到 inReach 名稱: ${name}`);
    return name;
  }
  
  Logger.log(`無法從 Subject 解析 inReach 名稱: ${subject}`);
  return null;
}

/**
 * 從內文提取使用者訊息
 * @param {string} body - 郵件內文（純文字）
 * @returns {string} 使用者訊息
 */
function parseMessageText(body) {
  if (!body) {
    return '';
  }
  
  let messageText = body;
  
  // 找到結束標記的位置，取之前的內容
  for (const marker of MESSAGE_END_MARKERS) {
    const markerIndex = messageText.indexOf(marker);
    if (markerIndex !== -1) {
      messageText = messageText.substring(0, markerIndex);
      break;
    }
  }
  
  // 清理文字
  messageText = messageText.trim();
  
  // 移除可能的 HTML 殘留
  messageText = messageText.replace(/<[^>]*>/g, '');
  
  // 移除多餘的空白行
  messageText = messageText.replace(/\n{3,}/g, '\n\n');
  
  Logger.log(`解析到使用者訊息: ${messageText.substring(0, 50)}...`);
  return messageText;
}

/**
 * 從內文提取 Garmin Explore 回覆連結
 * @param {string} body - 郵件內文（純文字）
 * @returns {string} Explore 連結或空字串
 */
function parseExploreLink(body) {
  if (!body) {
    return '';
  }
  
  const match = body.match(EXPLORE_LINK_REGEX);
  
  if (match && match[0]) {
    Logger.log(`解析到 Explore 連結: ${match[0]}`);
    return match[0];
  }
  
  return '';
}

/**
 * 解析完整的郵件訊息
 * @param {GoogleAppsScript.Gmail.GmailMessage} message - Gmail 訊息物件
 * @returns {Object} 解析後的資料物件
 */
function parseMessage(message) {
  const subject = message.getSubject();
  const body = message.getPlainBody();
  const messageId = message.getId();
  const date = message.getDate();
  
  const inreachName = parseInreachName(subject);
  const messageText = parseMessageText(body);
  const exploreLink = parseExploreLink(body);
  
  return {
    inreachName: inreachName,
    messageText: messageText,
    exploreLink: exploreLink,
    messageId: messageId,
    timestamp: date,
    subject: subject
  };
}

/**
 * 檢查訊息是否為有效的 inReach 訊息
 * @param {Object} parsedMessage - 解析後的訊息物件
 * @returns {boolean} 是否有效
 */
function isValidInreachMessage(parsedMessage) {
  return parsedMessage.inreachName !== null && 
         parsedMessage.messageText !== '';
}
