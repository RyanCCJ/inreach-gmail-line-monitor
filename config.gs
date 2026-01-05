/**
 * config.gs - Config Sheet Reading Module
 * Responsible for reading inReach settings from the Config sheet
 */

// Config Sheet Name
const CONFIG_SHEET_NAME = 'Config';

// Config Column Indices (0-based)
const CONFIG_COLUMNS = {
  ID: 0,
  INREACH_NAME: 1,
  TEAM_NAME: 2,
  START_TIME: 3,
  END_TIME: 4,
  ACTIVE: 5
};

/**
 * Get Spreadsheet ID from Script Properties
 * @returns {string} Spreadsheet ID
 */
function getSpreadsheetId() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID not set. Please add it in Script Properties.');
  }
  return spreadsheetId;
}

/**
 * Get inReach_monitor Spreadsheet
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} Spreadsheet object
 */
function getSpreadsheet() {
  const spreadsheetId = getSpreadsheetId();
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Get Config Sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} Config sheet
 */
function getConfigSheet() {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG_SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet "${CONFIG_SHEET_NAME}" not found`);
  }
  return sheet;
}

/**
 * Read all Config data
 * @returns {Array<Object>} Array of Config objects
 */
function getAllConfigs() {
  const sheet = getConfigSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const configs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[CONFIG_COLUMNS.ID]) { // Ensure ID exists
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
 * Get all active configs within valid time range
 * @returns {Array<Object>} Array of matching Config objects
 */
function getActiveInreachConfigs() {
  const configs = getAllConfigs();
  const now = new Date();
  
  return configs.filter(config => {
    if (!config.active) return false;
    
    // Check time range
    const startTime = new Date(config.startTime);
    const endTime = new Date(config.endTime);
    
    return now >= startTime && now <= endTime;
  });
}

/**
 * Find config by inReach name
 * @param {string} inreachName - inReach name
 * @returns {Object|null} Config object or null
 */
function findConfigByInreachName(inreachName) {
  const activeConfigs = getActiveInreachConfigs();
  
  // Use trim() for more flexible matching
  const trimmedName = inreachName ? inreachName.trim() : '';
  return activeConfigs.find(config => {
    const configName = config.inreachName ? config.inreachName.trim() : '';
    return configName === trimmedName;
  }) || null;
}

/**
 * Deactivate expired configs (past end_time)
 * Call this function periodically to auto-deactivate expired configs
 */
function deactivateExpiredConfigs() {
  const sheet = getConfigSheet();
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  let deactivatedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isActive = row[CONFIG_COLUMNS.ACTIVE] === true || row[CONFIG_COLUMNS.ACTIVE] === 'TRUE';
    const endTime = new Date(row[CONFIG_COLUMNS.END_TIME]);
    
    // If config is active but has passed end_time, deactivate it
    if (isActive && now > endTime) {
      const rowIndex = i + 1; // 1-based row index
      sheet.getRange(rowIndex, CONFIG_COLUMNS.ACTIVE + 1).setValue(false);
      Logger.log(`Deactivated expired config: ${row[CONFIG_COLUMNS.INREACH_NAME]} (ended: ${endTime})`);
      deactivatedCount++;
    }
  }
  
  if (deactivatedCount > 0) {
    Logger.log(`Deactivated ${deactivatedCount} expired configs`);
  }
  
  return deactivatedCount;
}
