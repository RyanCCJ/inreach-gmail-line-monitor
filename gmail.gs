/**
 * gmail.gs - Gmail Search and Label Management Module
 * Responsible for searching inReach emails and managing processing status labels
 */

// Gmail Label Name
const PROCESSED_LABEL_NAME = 'inreach_processed';

/**
 * Search for unprocessed inReach emails
 * @returns {Array<GoogleAppsScript.Gmail.GmailThread>} Array of Gmail threads
 */
function searchUnprocessedInreachEmails() {
  // Search criteria: Subject contains inReach message (Chinese or English) and excludes processed label
  // Also matches emails from inreach@garmin.com
  const searchQuery = '(subject:"的 inReach 訊息" OR subject:"inReach message from" OR from:inreach@garmin.com) -label:' + PROCESSED_LABEL_NAME;
  
  try {
    const threads = GmailApp.search(searchQuery);
    Logger.log(`Found ${threads.length} unprocessed inReach email threads`);
    return threads;
  } catch (error) {
    Logger.log(`Error searching emails: ${error.message}`);
    return [];
  }
}

/**
 * Get or create Gmail label
 * @param {string} labelName - Label name
 * @returns {GoogleAppsScript.Gmail.GmailLabel} Gmail label object
 */
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  
  if (!label) {
    Logger.log(`Creating new label: ${labelName}`);
    label = GmailApp.createLabel(labelName);
  }
  
  return label;
}

/**
 * Mark thread as processed
 * @param {GoogleAppsScript.Gmail.GmailThread} thread - Gmail thread
 */
function markThreadAsProcessed(thread) {
  const label = getOrCreateLabel(PROCESSED_LABEL_NAME);
  thread.addLabel(label);
  Logger.log(`Marked thread "${thread.getFirstMessageSubject()}" as processed`);
}

/**
 * Get all messages from a thread
 * @param {GoogleAppsScript.Gmail.GmailThread} thread - Gmail thread
 * @returns {Array<GoogleAppsScript.Gmail.GmailMessage>} Array of Gmail messages
 */
function getMessagesFromThread(thread) {
  return thread.getMessages();
}
