/**
 * watsonService.js
 *
 * Thin wrapper around IBM Watson Assistant v2 (ibm-watson SDK v12+).
 *
 * ── SDK v12 Parameter Change ──────────────────────────────────────────────────
 * The new Watson Assistant v2 API uses `environmentId` (not `assistantId`) for
 * createSession / message calls.
 *
 * How to find your environmentId:
 *   node backend/src/scripts/listWatsonEnvironments.js
 *
 * Add to .env:
 *   WATSON_ENVIRONMENT_ID=<draft or live environment id>
 *
 * Lifecycle:
 *  - createSession()  → returns a session_id (expires after 5 min of inactivity)
 *  - sendMessage()    → sends user text, returns assistant reply text + top intent
 *  - deleteSession()  → optional cleanup
 */

const AssistantV2          = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

// ── Initialise the SDK client ─────────────────────────────────────────────────
function buildClient() {
  // Strip the "ApiKey-" literal prefix if present (some IBM credential exports include it)
  const apikey = (process.env.WATSON_API_KEY || '').replace(/^ApiKey-/i, '');
  return new AssistantV2({
    version: '2021-11-27',
    authenticator: new IamAuthenticator({ apikey }),
    serviceUrl: process.env.WATSON_INSTANCE_URL,
  });
}

// SDK v12 requires BOTH assistantId and environmentId on every call
const assistantId   = () => process.env.WATSON_ASSISTANT_ID;
const environmentId = () => process.env.WATSON_ENVIRONMENT_ID;

// ── Session management ────────────────────────────────────────────────────────

/** Create a new conversation session. Returns the session_id string. */
async function createSession() {
  const client   = buildClient();
  const response = await client.createSession({ assistantId: assistantId(), environmentId: environmentId() });
  return response.result.session_id;
}

/** Delete a session (call when conversation ends or user disconnects). */
async function deleteSession(sessionId) {
  const client = buildClient();
  await client.deleteSession({ assistantId: assistantId(), environmentId: environmentId(), sessionId });
}

// ── Messaging ─────────────────────────────────────────────────────────────────

/**
 * Send a user message to Watson and get back a structured reply.
 *
 * @param {string} sessionId   - Active Watson session ID
 * @param {string} userText    - The message the user typed
 * @param {string} [userId]    - Stable user identifier (required by Watson API)
 * @returns {{ text: string, intent: string|null, confidence: number }}
 */
async function sendMessage(sessionId, userText, userId = 'anonymous') {
  const client = buildClient();

  const response = await client.message({
    assistantId:   assistantId(),
    environmentId: environmentId(),
    sessionId,
    userId,
    input: {
      message_type: 'text',
      text: userText,
    },
  });

  const result = response.result;

  // Extract first text response from generic output
  const textOutputs = (result.output?.generic || [])
    .filter(g => g.response_type === 'text')
    .map(g => g.text);
  const text = textOutputs.join('\n') || "I'm not sure how to help with that. Try saying 'help'.";

  // Extract top intent
  const topIntent = result.output?.intents?.[0] || null;

  return {
    text,
    intent:     topIntent?.intent     || null,
    confidence: topIntent?.confidence || 0,
  };
}

// ── Health check ──────────────────────────────────────────────────────────────

/**
 * Verifies Watson credentials by creating and immediately deleting a session.
 * Throws if credentials are invalid or WATSON_ENVIRONMENT_ID is not set.
 */
async function testConnection() {
  if (!environmentId()) throw new Error('WATSON_ENVIRONMENT_ID is not set in .env');
  const sessionId = await createSession();
  await deleteSession(sessionId);
  return true;
}

module.exports = { createSession, deleteSession, sendMessage, testConnection };
