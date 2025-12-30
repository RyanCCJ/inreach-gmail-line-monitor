/**
 * main.gs - 主程式入口點
 * Garmin inReach Gmail 監控系統
 */

/**
 * 主掃描函數 - 掃描並處理 inReach 郵件
 * 可設定為 Time-driven trigger 定時執行
 */
function scanInreachMails() {
  Logger.log('========== 開始掃描 inReach 郵件 ==========');
  
  try {
    // 1. 搜尋未處理的郵件
    const threads = searchUnprocessedInreachEmails();
    
    if (threads.length === 0) {
      Logger.log('沒有未處理的 inReach 郵件');
      return;
    }
    
    let processedCount = 0;
    let skippedCount = 0;
    
    // 2. 處理每個 thread
    for (const thread of threads) {
      const messages = getMessagesFromThread(thread);
      let threadProcessed = false;
      
      for (const message of messages) {
        // 3. 解析訊息
        const parsedMessage = parseMessage(message);
        
        // 4. 檢查是否為有效的 inReach 訊息
        if (!isValidInreachMessage(parsedMessage)) {
          Logger.log(`無效的訊息，跳過: ${message.getSubject()}`);
          continue;
        }
        
        // 5. 查找對應的 Config 設定
        const config = findConfigByInreachName(parsedMessage.inreachName);
        
        if (!config) {
          Logger.log(`找不到對應的設定或已過期，跳過: ${parsedMessage.inreachName}`);
          skippedCount++;
          continue;
        }
        
        // 6. 寫入資料到對應分頁
        const written = processAndWriteMessage(parsedMessage, config);
        
        if (written) {
          processedCount++;
          threadProcessed = true;
          
          // 7. 推送 Line 通知（獨立處理，失敗不影響其他流程）
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
            Logger.log(`Line 推播失敗，但不影響其他處理: ${lineError.message}`);
          }
        }
      }
      
      // 7. 標記 thread 為已處理
      markThreadAsProcessed(thread);
    }
    
    Logger.log(`========== 掃描完成 ==========`);
    Logger.log(`處理: ${processedCount} 則訊息`);
    Logger.log(`跳過: ${skippedCount} 則訊息`);
    
  } catch (error) {
    Logger.log(`執行時發生錯誤: ${error.message}`);
    Logger.log(error.stack);
  }
}

/**
 * 設定定時觸發器（每 5 分鐘執行一次）
 */
function setupTrigger() {
  // 先移除現有觸發器
  removeTrigger();
  
  // 建立新的觸發器
  ScriptApp.newTrigger('scanInreachMails')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  Logger.log('已設定每 5 分鐘執行一次的觸發器');
}

/**
 * 移除所有 scanInreachMails 的觸發器
 */
function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanInreachMails') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('已移除觸發器');
    }
  }
}

/**
 * 列出所有觸發器
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  if (triggers.length === 0) {
    Logger.log('目前沒有任何觸發器');
    return;
  }
  
  for (const trigger of triggers) {
    Logger.log(`觸發器: ${trigger.getHandlerFunction()} - ${trigger.getTriggerSource()}`);
  }
}

/**
 * 測試函數 - 顯示目前的 Config 設定
 */
function testShowConfigs() {
  const configs = getAllConfigs();
  Logger.log('所有 Config 設定:');
  configs.forEach(config => {
    Logger.log(JSON.stringify(config));
  });
  
  const activeConfigs = getActiveInreachConfigs();
  Logger.log('活躍的 Config 設定:');
  activeConfigs.forEach(config => {
    Logger.log(JSON.stringify(config));
  });
}

/**
 * 測試函數 - 測試郵件搜尋
 */
function testSearchEmails() {
  const threads = searchUnprocessedInreachEmails();
  Logger.log(`找到 ${threads.length} 個 thread`);
  
  threads.forEach(thread => {
    Logger.log(`Subject: ${thread.getFirstMessageSubject()}`);
  });
}
