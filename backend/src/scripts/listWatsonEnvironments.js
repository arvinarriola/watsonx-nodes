/**
 * listWatsonEnvironments.js
 *
 * Run this script after refreshing your Watson API key to discover your
 * WATSON_ENVIRONMENT_ID. Copy the "draft" or "live" environment ID into .env.
 *
 * Usage:
 *   node backend/src/scripts/listWatsonEnvironments.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const AssistantV2       = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');

const apikey      = (process.env.WATSON_API_KEY || '').replace(/^ApiKey-/i, '');
const assistantId = process.env.WATSON_ASSISTANT_ID;

if (!apikey)      { console.error('❌ WATSON_API_KEY not set'); process.exit(1); }
if (!assistantId) { console.error('❌ WATSON_ASSISTANT_ID not set'); process.exit(1); }

const client = new AssistantV2({
  version: '2021-11-27',
  authenticator: new IamAuthenticator({ apikey }),
  serviceUrl: process.env.WATSON_INSTANCE_URL,
});

client.listEnvironments({ assistantId })
  .then(res => {
    const envs = res.result?.environments || [];
    if (!envs.length) {
      console.log('No environments found. Make sure WATSON_ASSISTANT_ID is correct.');
      return;
    }
    console.log('\n✅ Watson Environments:\n');
    envs.forEach(e => {
      console.log(`  Name:  ${e.name}`);
      console.log(`  ID:    ${e.environment_id}`);
      console.log(`  Type:  ${e.environment === 'draft' ? 'Draft (for testing)' : 'Live (production)'}`);
      console.log('');
    });
    console.log('👉 Copy the environment_id you want into .env as WATSON_ENVIRONMENT_ID=...');
  })
  .catch(err => {
    console.error('❌ Error:', err.status || '', err.message);
    if (err.status === 401 || err.status === 400) {
      console.error('\n→ The API key is invalid or expired.');
      console.error('  Regenerate it at: https://cloud.ibm.com/resources → Watson Assistant → Service credentials');
    }
  });
