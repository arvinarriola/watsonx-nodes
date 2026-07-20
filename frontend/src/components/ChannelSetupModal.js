import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

// ─── Step definitions per channel ────────────────────────────────────────────

const SLACK_STEPS = [
  {
    title: 'Create a Slack App',
    body: 'Go to api.slack.com/apps and click "Create New App" → "From scratch". Give it a name (e.g. WatsonX Nodes) and pick your workspace.',
  },
  {
    title: 'Enable Incoming Webhooks',
    body: 'In the left sidebar click "Incoming Webhooks". Toggle it ON. Scroll down and click "Add New Webhook to Workspace". Choose the channel you want alerts in, then click Allow.',
  },
  {
    title: 'Copy your Webhook URL',
    body: 'After allowing, a webhook URL will appear. It looks like:\nhooks.slack.com/services/T.../B.../...\nCopy it and paste it below.',
    input: true,
    placeholder: 'https://hooks.slack.com/services/...',
    inputType: 'url',
  },
];

const WHATSAPP_STEPS = [
  {
    title: 'Join the Twilio Sandbox',
    body: 'From your WhatsApp, send the message below to +1 415 523 8886. This opts you in to receive messages from the sandbox.',
    code: 'join <your-sandbox-keyword>',
    hint: 'Your sandbox keyword is shown in Twilio Console → Messaging → Try it out → Send a WhatsApp message.',
  },
  {
    title: 'Enter your WhatsApp number',
    body: 'Enter the phone number you just used to join the sandbox. Include your country code.',
    input: true,
    placeholder: '+63912345678',
    inputType: 'tel',
  },
];

const TEAMS_STEPS = [
  {
    title: 'Open the target Teams channel',
    body: 'In Microsoft Teams, go to the channel where you want to receive alerts. Click "..." next to the channel name.',
  },
  {
    title: 'Add a Workflow',
    body: 'Click "Workflows". Search for "Post to a channel when a webhook request is received". Click it, then click "Add workflow" and follow the prompts.',
  },
  {
    title: 'Copy the webhook URL',
    body: 'After the workflow is created, a URL will be shown. It looks like:\nprod-xx.westus.logic.azure.com/workflows/...\nCopy it and paste it below.',
    input: true,
    placeholder: 'https://prod-xx.westus.logic.azure.com/workflows/...',
    inputType: 'url',
  },
];

const CHANNEL_STEPS = { slack: SLACK_STEPS, whatsapp: WHATSAPP_STEPS, teams: TEAMS_STEPS };
const CHANNEL_LABELS = { slack: 'Slack', whatsapp: 'WhatsApp', teams: 'Teams' };
const CHANNELS = ['slack', 'whatsapp', 'teams'];

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function ChannelSetupModal({ nodeId, node, current, onClose, onSuccess }) {
  const [channel,  setChannel]  = useState(current?.channel || 'slack');
  const [step,     setStep]     = useState(0);
  const [value,    setValue]    = useState(
    current?.channel_config?.webhook_url || current?.channel_config?.phone || ''
  );
  const [loading,  setLoading]  = useState(false);

  const steps = CHANNEL_STEPS[channel];
  const currentStep = steps[step];
  const isLastStep  = step === steps.length - 1;
  const inputStep   = steps.findIndex(s => s.input);

  // Reset step and value when channel changes
  const handleChannelChange = (ch) => {
    setChannel(ch);
    setStep(0);
    setValue('');
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    const channel_config = channel === 'whatsapp' ? { phone: value } : { webhook_url: value };

    if (!value.trim()) {
      toast.error(`Please enter your ${channel === 'whatsapp' ? 'phone number' : 'webhook URL'}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/nodes/${nodeId}/subscribe`, { channel, channel_config });
      toast.success(current ? 'Subscription updated!' : 'Subscribed successfully!');
      onSuccess(res.data.subscription);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const FREQ_COLORS = {
    immediate: 'bg-red-100 text-red-700',
    daily:     'bg-yellow-100 text-yellow-700',
    weekly:    'bg-green-100 text-green-700',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        {/* Header */}
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          {current ? 'Update Subscription' : 'Subscribe to Node'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{node?.title}</p>

        {/* Alert schedule info */}
        {node && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Alert Schedule</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FREQ_COLORS[node.frequency] || 'bg-gray-100 text-gray-600'}`}>
                {node.frequency || 'immediate'}
              </span>
              {node.schedule_time && node.frequency !== 'immediate' && (
                <span className="text-xs text-gray-600">at <strong>{node.schedule_time}</strong></span>
              )}
              <span className="text-xs text-gray-400 ml-1">· set by node owner</span>
            </div>
          </div>
        )}

        {/* Channel selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Channel <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {CHANNELS.map(c => (
              <button
                key={c} type="button"
                onClick={() => handleChannelChange(c)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  channel === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 min-h-[120px]">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Step {step + 1} of {steps.length}
          </p>
          <p className="text-sm font-semibold text-gray-800 mb-2">{currentStep.title}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{currentStep.body}</p>

          {currentStep.code && (
            <div className="mt-2 bg-gray-800 text-green-400 text-xs font-mono rounded-lg px-3 py-2 select-all">
              {currentStep.code}
            </div>
          )}
          {currentStep.hint && (
            <p className="text-xs text-gray-400 mt-2">{currentStep.hint}</p>
          )}
        </div>

        {/* Input field on input step */}
        {currentStep.input && (
          <div className="mb-4">
            <input
              type={currentStep.inputType || 'text'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading || (currentStep.input && !value.trim())}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
          >
            {loading ? 'Saving...' : isLastStep ? (current ? 'Update' : 'Subscribe') : 'Next →'}
          </button>
          <button
            type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
