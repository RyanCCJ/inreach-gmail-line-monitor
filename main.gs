/**
 * main.gs - Main Entry Point
 * Garmin inReach Gmail Monitor System
 */

/**
 * Main Scan Function - Scans and processes inReach emails
 * Can be set up with a Time-driven trigger for periodic execution
 */
function scanInreachMails() {
  Logger.log('========== Start Scanning inReach Emails ==========');
  
  try {
    // 0. Auto-deactivate expired configs
    deactivateExpiredConfigs();
    
    // 1. Search for unprocessed emails
    const threads = searchUnprocessedInreachEmails();
    
    if (threads.length === 0) {
      Logger.log('No unprocessed inReach emails found');
      return;
    }
    
    let processedCount = 0;
    let skippedCount = 0;
    
    // 2. Process each thread
    for (const thread of threads) {
      const messages = getMessagesFromThread(thread);
      let threadProcessed = false;
      
      for (const message of messages) {
        // 3. Parse message
        const parsedMessage = parseMessage(message);
        
        // 4. Check if it's a valid inReach message
        if (!isValidInreachMessage(parsedMessage)) {
          Logger.log(`Invalid message, skipping: ${message.getSubject()}`);
          continue;
        }
        
        // 5. Find corresponding Config setting
        const config = findConfigByInreachName(parsedMessage.inreachName);
        
        if (!config) {
          Logger.log(`Config not found or expired, skipping: ${parsedMessage.inreachName}`);
          skippedCount++;
          continue;
        }
        
        // 6. Write data to corresponding sheet
        const written = processAndWriteMessage(parsedMessage, config);
        
        if (written) {
          processedCount++;
          threadProcessed = true;
          
          // 7. Send Line notification (handled independently, failure doesn't affect other processes)
          try {
            const notificationData = {
              inreachName: parsedMessage.inreachName,
              teamName: config.teamName,
              timestamp: parsedMessage.timestamp,
              messageText: parsedMessage.messageText,
              exploreLink: parsedMessage.exploreLink
            };
            sendLineNotification(notificationData);
          } catch (lineError) {
            Logger.log(`Line notification failed, but other processes are unaffected: ${lineError.message}`);
          }
        }
      }
      
      // 7. Mark thread as processed
      markThreadAsProcessed(thread);
    }
    
    Logger.log(`========== Scan Completed ==========`);
    Logger.log(`Processed: ${processedCount} messages`);
    Logger.log(`Skipped: ${skippedCount} messages`);
    
  } catch (error) {
    Logger.log(`Execution Error: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * Setup periodic trigger (runs every 5 minutes)
 */
function setupTrigger() {
  // Remove existing trigger first
  removeTrigger();
  
  // Create new trigger
  ScriptApp.newTrigger('scanInreachMails')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  Logger.log('Trigger set to run every 5 minutes');
}

/**
 * Remove all triggers for scanInreachMails
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('Trigger removed');
    }
  }
}

/**
 * List all triggers
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    Logger.log('No triggers found');
    return;
  }
  
  for (const trigger of triggers) {
    Logger.log(`Trigger: ${trigger.getHandlerFunction()} - ${trigger.getTriggerSource()}`);
  }
}

/**
 * Test Function - Show current Config settings
 */
function testShowConfigs() {
  const configs = getAllConfigs();
  Logger.log('All Config Settings:');
  configs.forEach(config => {
    Logger.log(JSON.stringify(config));
  });
  
  const activeConfigs = getActiveInreachConfigs();
  Logger.log('Active Config Settings:');
  activeConfigs.forEach(config => {
    Logger.log(JSON.stringify(config));
  });
}

/**
 * Test Function - Test email search
 */
function testSearchEmails() {
  const threads = searchUnprocessedInreachEmails();
  Logger.log(`Found ${threads.length} threads`);
  
  threads.forEach(thread => {
    Logger.log(`Subject: ${thread.getFirstMessageSubject()}`);
  });
}
