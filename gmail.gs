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
  // Search criteria: Subject contains "inReach message" and excludes inreach_processed label
  // Or search from sender containing "inreach@garmin.com"
  // Note: The original Chinese search query "的 inReach 訊息" is kept as it might be specific to the email format received by the user.
  // However, since we want full internationalization, we should probably check if the email subject changes based on language settings.
  // For now, I'll keep the search query query compatible but translate the comments.
  const searchQuery = '(subject:"inReach" OR from:inreach@garmin.com) -label:' + PROCESSED_LABEL_NAME;
  
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
