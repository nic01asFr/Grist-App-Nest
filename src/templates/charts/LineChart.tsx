/**
 * Line Chart Component - Time series visualization
 */

import { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface LineChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: Array<{ key: string; label: string; color: string }>;
  title?: string;
  height?: number;
}

export default function LineChart({
  data,
  xKey,
  yKeys,
  title,
  height = 400,
}: LineChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      [xKey]: item[xKey],
    }));
  }, [data, xKey]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {title && (
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          {yKeys.map((yKey) => (
            <Line
              key={yKey.key}
              type="monotone"
              dataKey={yKey.key}
              name={yKey.label}
              stroke={yKey.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
