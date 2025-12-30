/**
 * parser.gs - Email Content Parsing Module
 * Responsible for parsing inReach email Subject and Body
 */

// Subject Parsing Regex (Traditional Chinese format)
const SUBJECT_REGEX = /來自 (.+?) 的 inReach 訊息/;

// Message End Markers (User message is before these markers)
const MESSAGE_END_MARKERS = [
  '檢視其位置',
  'View the location',
  'View their location'
];

// Garmin Explore Link Regex
const EXPLORE_LINK_REGEX = /https?:\/\/[a-z]+\.explore\.garmin\.com\/textmessage\/txtmsg\?[^\s]+/gi;

/**
 * Parse inReach name from Subject
 * @param {string} subject - Email subject
 * @returns {string|null} inReach name or null
 */
function parseInreachName(subject) {
  const match = subject.match(SUBJECT_REGEX);
  
  if (match && match[1]) {
    const name = match[1].trim();
    Logger.log(`Parsed inReach name from Subject: ${name}`);
    return name;
  }
  
  // Try English format: "inReach message from XXXX"
  const englishMatch = subject.match(/inReach message from (.+)/i);
  if (englishMatch && englishMatch[1]) {
    const name = englishMatch[1].trim();
    Logger.log(`Parsed inReach name from Subject (English): ${name}`);
    return name;
  }
  
  Logger.log(`Failed to parse inReach name from Subject: ${subject}`);
  return null;
}

/**
 * Extract user message from body
 * @param {string} body - Email body (plain text)
 * @returns {string} User message
 */
function parseMessageText(body) {
  if (!body) {
    return '';
  }
  
  let messageText = body;
  
  // Find the position of the end marker and take the content before it
  for (const marker of MESSAGE_END_MARKERS) {
    const markerIndex = messageText.indexOf(marker);
    if (markerIndex !== -1) {
      messageText = messageText.substring(0, markerIndex);
      break;
    }
  }
  
  // Clean up text
  messageText = messageText.trim();
  
  // Remove potential HTML residue
  messageText = messageText.replace(/<[^>]*>/g, '');
  
  // Remove excess blank lines
  messageText = messageText.replace(/\n{3,}/g, '\n\n');
  
  Logger.log(`Parsed user message: ${messageText.substring(0, 50)}...`);
  return messageText;
}

/**
 * Extract Garmin Explore reply link from body
 * @param {string} body - Email body (plain text)
 * @returns {string} Explore link or empty string
 */
function parseExploreLink(body) {
  if (!body) {
    return '';
  }
  
  const match = body.match(EXPLORE_LINK_REGEX);
  
  if (match && match[0]) {
    Logger.log(`Parsed Explore link: ${match[0]}`);
    return match[0];
  }
  
  return '';
}

/**
 * Parse complete email message
 * @param {GoogleAppsScript.Gmail.GmailMessage} message - Gmail message object
 * @returns {Object} Parsed data object
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
 * Check if the message is a valid inReach message
 * @param {Object} parsedMessage - Parsed message object
 * @returns {boolean} Validity
 */
function isValidInreachMessage(parsedMessage) {
  return parsedMessage.inreachName !== null && 
         parsedMessage.messageText !== '';
}
