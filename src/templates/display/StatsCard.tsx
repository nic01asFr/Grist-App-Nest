/**
 * StatsCard Template
 * Displays a metric with icon, value, and optional trend
 */

import type { StatsCardProps } from '@core/types';

const colors = {
  blue: 'from-blue-500 to-purple-600',
  green: 'from-green-500 to-teal-500',
  red: 'from-pink-500 to-red-500',
  orange: 'from-orange-500 to-yellow-500',
  purple: 'from-purple-500 to-indigo-600',
  gray: 'from-gray-500 to-gray-700',
};

export default function StatsCard({
  title,
  value,
  icon,
  color = 'blue',
  trend,
}: StatsCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm opacity-90 uppercase tracking-wide">{title}</div>
      {trend !== undefined && (
        <div className="mt-3 text-sm flex items-center gap-1">
          {trend > 0 ? '📈' : '📉'}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );
}
