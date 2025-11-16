/**
 * Bar Chart Component - Comparison visualization
 */

import { useMemo } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BarChartProps {
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: Array<{ key: string; label: string; color: string }>;
  title?: string;
  height?: number;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  xKey,
  yKeys,
  title,
  height = 400,
  horizontal = false,
}: BarChartProps) {
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
        <RechartsBarChart
          data={chartData}
          layout={horizontal ? 'vertical' : 'horizontal'}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {horizontal ? (
            <>
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey={xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            </>
          )}
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
            iconType="rect"
          />
          {yKeys.map((yKey) => (
            <Bar
              key={yKey.key}
              dataKey={yKey.key}
              name={yKey.label}
              fill={yKey.color}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
