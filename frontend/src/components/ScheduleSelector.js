import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SCHEDULE_TYPES = [
  { value: 'immediate',        label: 'Immediate',          desc: 'Alert sent instantly when this post is published.' },
  { value: 'specific_datetime', label: 'Specific Date & Time', desc: 'Alert sent once at the exact date and time you choose.' },
  { value: 'specific_days',    label: 'Specific Days',       desc: 'Alert sent on selected days of the week at a set time.' },
  { value: 'every_x_days',     label: 'Every X Days',        desc: 'Alert sent repeatedly every X days at a set time.' },
];

export function scheduleLabel(update) {
  const { schedule_type, schedule_config } = update;
  switch (schedule_type) {
    case 'immediate':
      return 'Immediate';
    case 'specific_datetime':
      return schedule_config.datetime
        ? `On ${new Date(schedule_config.datetime).toLocaleString()}`
        : 'Specific Date & Time';
    case 'specific_days':
      return schedule_config.days?.length
        ? `${schedule_config.days.join(', ')} at ${schedule_config.time || '—'}`
        : 'Specific Days';
    case 'every_x_days':
      return `Every ${schedule_config.every_x_days || '?'} day${schedule_config.every_x_days === 1 ? '' : 's'} at ${schedule_config.time || '—'}`;
    default:
      return schedule_type;
  }
}

export const SCHEDULE_BADGE = {
  immediate:        'bg-red-100 text-red-700',
  specific_datetime:'bg-blue-100 text-blue-700',
  specific_days:    'bg-purple-100 text-purple-700',
  every_x_days:     'bg-yellow-100 text-yellow-700',
};

// Full schedule selector widget used in the post form and edit form
export default function ScheduleSelector({ value, onChange }) {
  const { schedule_type = 'immediate', schedule_config = {} } = value;

  const update = (type, config) => onChange({ schedule_type: type, schedule_config: config });
  const patch  = (configPatch) => onChange({ schedule_type, schedule_config: { ...schedule_config, ...configPatch } });

  const toggleDay = (day) => {
    const days = schedule_config.days || [];
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    patch({ days: next });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Type selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SCHEDULE_TYPES.map(t => (
          <button
            key={t.value} type="button"
            onClick={() => update(t.value, {})}
            className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors text-center ${
              schedule_type === t.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Type description */}
      <p className="text-xs text-gray-400">
        {SCHEDULE_TYPES.find(t => t.value === schedule_type)?.desc}
      </p>

      {/* Specific Date & Time */}
      {schedule_type === 'specific_datetime' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date &amp; Time</label>
          <input
            type="datetime-local" required
            value={schedule_config.datetime || ''}
            onChange={e => patch({ datetime: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Specific Days */}
      {schedule_type === 'specific_days' && (
        <div className="flex flex-col gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Days of the Week</label>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map(d => (
                <button
                  key={d} type="button"
                  onClick={() => toggleDay(d)}
                  className={`w-10 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    (schedule_config.days || []).includes(d)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Send Time</label>
            <input
              type="time" required
              value={schedule_config.time || ''}
              onChange={e => patch({ time: e.target.value })}
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Every X Days */}
      {schedule_type === 'every_x_days' && (
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Every</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="1" max="365" required
                value={schedule_config.every_x_days || ''}
                onChange={e => patch({ every_x_days: parseInt(e.target.value) || '' })}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3"
              />
              <span className="text-sm text-gray-600">day(s)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Send Time</label>
            <input
              type="time" required
              value={schedule_config.time || ''}
              onChange={e => patch({ time: e.target.value })}
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
