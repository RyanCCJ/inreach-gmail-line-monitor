/**
 * sheet.gs - Google Sheet Creation and Writing Module
 * Responsible for creating team sheets and writing message data
 */

// Sheet Header Columns
const SHEET_HEADERS = ['timestamp', 'inreach_name', 'team_name', 'message_text', 'explore_link', 'gmail_message_id'];

/**
 * Generate Sheet Name
 * @param {string} teamName - Team name
 * @returns {string} Sheet name (teamName)
 */
function generateSheetName(teamName) {
  return teamName;
}

/**
 * Initialize Sheet Headers
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet object
 */
function initializeSheetHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  headerRange.setValues([SHEET_HEADERS]);
  
  // Set header style
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4a86e8');
  headerRange.setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Adjust column widths
  sheet.setColumnWidth(1, 180); // timestamp
  sheet.setColumnWidth(2, 120); // inreach_name
  sheet.setColumnWidth(3, 120); // team_name
  sheet.setColumnWidth(4, 400); // message_text
  sheet.setColumnWidth(5, 350); // explore_link
  sheet.setColumnWidth(6, 200); // gmail_message_id
  
  Logger.log('Initialized sheet headers');
}

/**
 * Get or create Team Sheet
 * @param {string} teamName - Team name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Sheet object
 */
function getOrCreateTeamSheet(teamName) {
  const spreadsheet = getSpreadsheet();
  const sheetName = generateSheetName(teamName);
  
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log(`Creating new sheet: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
    initializeSheetHeaders(sheet);
  }
  
  return sheet;
}

/**
 * Check if message already exists (avoid duplicates)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet object
 * @param {string} messageId - Gmail Message ID
 * @returns {boolean} Exists
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
 * Write message data to sheet
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Sheet object
 * @param {Object} data - Message data
 * @returns {boolean} Write success status
 */
function writeMessageToSheet(sheet, data) {
  // Check if already exists
  if (isMessageExists(sheet, data.messageId)) {
    Logger.log(`Message ${data.messageId} already exists, skipping`);
    return false;
  }
  
  // Prepare row data
  const row = [
    data.timestamp,
    data.inreachName,
    data.teamName,
    data.messageText,
    data.exploreLink,
    data.messageId
  ];
  
  // Append to last row
  sheet.appendRow(row);
  
  Logger.log(`Written message to sheet: ${data.inreachName} - ${data.messageText.substring(0, 30)}...`);
  return true;
}

/**
 * Process and write message
 * @param {Object} parsedMessage - Parsed message
 * @param {Object} config - Config setting
 * @returns {boolean} Write success status
 */
function processAndWriteMessage(parsedMessage, config) {
  const sheet = getOrCreateTeamSheet(config.teamName);
  
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
