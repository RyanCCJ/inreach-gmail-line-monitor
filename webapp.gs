/**
 * webapp.gs - Web App Server-side Module
 * Provides API for the management interface
 */

/**
 * Web App Entry Point - Returns HTML page
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Garmin inReach Monitor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== Config CRUD API ====================

/**
 * Get all Configs (for frontend call)
 * @returns {Object} Includes configs and activeCount
 */
function getConfigsForWeb() {
  const configs = getAllConfigs();
  const now = new Date();
  
  // Add active status to each config
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
 * Format date for input datetime-local format
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
 * Add Configuration
 * @param {Object} data - Config data
 * @returns {Object} Result
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
 * Update Configuration
 * @param {Object} data - Config data (must include id)
 * @returns {Object} Result
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
    
    return { success: false, error: 'Config not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete Configuration
 * @param {number} id - Config ID
 * @returns {Object} Result
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
    
    return { success: false, error: 'Config not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get Next Available ID
 * @returns {number} Next ID
 */
function getNextConfigId() {
  const configs = getAllConfigs();
  if (configs.length === 0) return 1;
  
  const maxId = Math.max(...configs.map(c => Number(c.id) || 0));
  return maxId + 1;
}

// ==================== Trigger API ====================

/**
 * Get Current Scan Frequency (minutes)
 * @returns {number|null} Frequency or null
 */
function getScanFrequency() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      // Cannot get frequency directly, return default
      return 5;
    }
  }
  
  return null;
}

/**
 * Set Scan Frequency
 * @param {number} minutes - Minutes (1, 5, 10, 15, 30)
 * @returns {Object} Result
 */
function setScanFrequency(minutes) {
  try {
    // Remove existing trigger first
    removeTrigger();
    
    // Create new trigger
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
 * Get Trigger Status
 * @returns {Object} Status info
 */
function getTriggerStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      return {
        enabled: true,
        frequency: 5 // Default display
      };
    }
  }
  
  return {
    enabled: false,
    frequency: null
  };
}
