const axios = require('axios');
const twilio = require('twilio');
const supabase = require('../db/supabase');

const twilioClient = () => twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ─── Channel senders ──────────────────────────────────────────────────────────
async function sendToSlack(webhookUrl, message) {
  await axios.post(webhookUrl, { text: message });
}

async function sendToTeams(webhookUrl, message) {
  await axios.post(webhookUrl, {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [{ type: 'TextBlock', text: message, wrap: true }],
      },
    }],
  });
}

async function sendToWhatsApp(phone, message) {
  await twilioClient().messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${phone}`,
    body: message,
  });
}

async function sendNotification(subscription, message) {
  const config = subscription.channel_config;
  switch (subscription.channel) {
    case 'slack':    await sendToSlack(config.webhook_url, message);    break;
    case 'teams':    await sendToTeams(config.webhook_url, message);    break;
    case 'whatsapp': await sendToWhatsApp(config.phone, message);       break;
    default: throw new Error(`Unknown channel: ${subscription.channel}`);
  }
}

async function logNotification(subscriptionId, updateId, status, error = null) {
  await supabase.from('notifications').insert({
    subscription_id: subscriptionId,
    update_id: updateId,
    status,
    error_message: error,
    sent_at: status === 'sent' ? new Date() : null,
  });
}

// ─── Immediate dispatch ───────────────────────────────────────────────────────
async function dispatchImmediate(nodeId, update, nodeTitle) {
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('node_id', nodeId)
    .eq('is_active', true);

  if (!subs?.length) return;

  const message = `📢 *${nodeTitle}*\n\n${update.content}\n\n_Posted: ${new Date(update.posted_at).toLocaleString()}_`;

  for (const sub of subs) {
    try {
      await sendNotification(sub, message);
      await logNotification(sub.id, update.id, 'sent');
    } catch (err) {
      console.error(`Failed to notify subscription ${sub.id}:`, err.message);
      await logNotification(sub.id, update.id, 'failed', err.message);
    }
  }
}

// ─── Scheduled dispatch — called by cron ─────────────────────────────────────
async function dispatchScheduled() {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = dayNames[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Fetch all open, non-immediate posts
  const { data: posts } = await supabase
    .from('updates')
    .select('*, nodes(title)')
    .eq('status', 'open')
    .neq('schedule_type', 'immediate');

  if (!posts?.length) return;

  for (const post of posts) {
    const { schedule_type, schedule_config } = post;
    let shouldFire = false;

    if (schedule_type === 'specific_datetime') {
      const target = schedule_config.datetime?.slice(0, 16); // YYYY-MM-DDTHH:MM
      const nowStr = now.toISOString().slice(0, 16);
      shouldFire = target === nowStr;
    } else if (schedule_type === 'specific_days') {
      shouldFire = (schedule_config.days || []).includes(todayName) &&
                   schedule_config.time === currentTime;
    } else if (schedule_type === 'every_x_days') {
      const posted = new Date(post.posted_at);
      const daysDiff = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
      shouldFire = daysDiff > 0 &&
                   daysDiff % (schedule_config.every_x_days || 1) === 0 &&
                   schedule_config.time === currentTime;
    }

    if (!shouldFire) continue;

    // Get subscribers
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('node_id', post.node_id)
      .eq('is_active', true);

    if (!subs?.length) continue;

    const nodeTitle = post.nodes?.title || 'Node';
    const message = `📢 *${nodeTitle}*\n\n${post.content}\n\n_${schedule_type.replace(/_/g, ' ')} alert · ${new Date().toLocaleString()}_`;

    for (const sub of subs) {
      try {
        await sendNotification(sub, message);
        await logNotification(sub.id, post.id, 'sent');
      } catch (err) {
        console.error(`Scheduled dispatch failed for subscription ${sub.id}:`, err.message);
        await logNotification(sub.id, post.id, 'failed', err.message);
      }
    }
  }
}

module.exports = { dispatchImmediate, dispatchScheduled };
