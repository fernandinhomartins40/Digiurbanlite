'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Base Chart Props
interface BaseChartProps {
  title?: string;
  className?: string;
  loading?: boolean;
}

// Line Chart Component
interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps extends BaseChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
}

export function LineChart({
  data,
  title,
  height = 200,
  color = 'hsl(var(--primary))',
  className,
  loading = false
}: LineChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`h-[${height}px] bg-muted animate-pulse rounded`}></div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative">
          <svg
            width="100%"
            height={height}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <polygon
              points={`0,100 ${points} 100,100`}
              fill="url(#gradient)"
            />

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* Points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item.value - minValue) / range) * 100;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1"
                  fill={color}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* Tooltip area */}
          <div className="absolute inset-0 flex">
            {data.map((item, index) => (
              <div
                key={index}
                className="flex-1 group relative"
                title={`${item.label}: ${item.value.toLocaleString('pt-BR')}`}
              >
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-popover border rounded p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-muted-foreground">{item.value.toLocaleString('pt-BR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Bar Chart Component
interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps extends BaseChartProps {
  data: BarChartData[];
  height?: number;
  horizontal?: boolean;
}

export function BarChart({
  data,
  title,
  height = 200,
  horizontal = false,
  className,
  loading = false
}: BarChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`h-[${height}px] bg-muted animate-pulse rounded`}></div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className={`h-[${height}px] space-y-2`}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-20 text-xs text-right truncate">
                {item.label}
              </div>
              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || 'hsl(var(--primary))'
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {item.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Pie Chart Component
interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps extends BaseChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
}

export function PieChart({
  data,
  title,
  size = 200,
  showLegend = true,
  className,
  loading = false
}: PieChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`w-[${size}px] h-[${size}px] bg-muted animate-pulse rounded-full mx-auto`}></div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  let cumulativePercentage = 0;
  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted))',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c'
  ];

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <svg width={size} height={size}>
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const startAngle = (cumulativePercentage / 100) * 360;
              const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

              cumulativePercentage += percentage;

              const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
              const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
              const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

              const largeArcFlag = percentage > 50 ? 1 : 0;
              const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {showLegend && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color || colors[index % colors.length] }}
                  ></div>
                  <span className="truncate">
                    {item.label}: {((item.value / total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Chart (for real-time data)
interface ActivityData {
  timestamp: string;
  value: number;
}

interface ActivityChartProps extends BaseChartProps {
  data: ActivityData[];
  height?: number;
  color?: string;
  maxPoints?: number;
}

export function ActivityChart({
  data,
  title,
  height = 100,
  color = 'hsl(var(--primary))',
  maxPoints = 50,
  className,
  loading = false
}: ActivityChartProps) {
  if (loading) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className={`h-[${height}px] bg-muted animate-pulse rounded`}></div>
        </CardContent>
      </Card>
    );
  }

  // Limit the number of points for performance
  const limitedData = data.slice(-maxPoints);
  const maxValue = Math.max(...limitedData.map(d => d.value));
  const minValue = Math.min(...limitedData.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = limitedData.map((item, index) => {
    const x = (index / (limitedData.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-2">
        <svg
          width="100%"
          height={height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#activityGradient)"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>
            {limitedData.length > 0 ? new Date(limitedData[0].timestamp).toLocaleTimeString('pt-BR') : ''}
          </span>
          <span className="font-medium">
            Atual: {limitedData.length > 0 ? limitedData[limitedData.length - 1].value.toLocaleString('pt-BR') : 0}
          </span>
          <span>
            {limitedData.length > 0 ? new Date(limitedData[limitedData.length - 1].timestamp).toLocaleTimeString('pt-BR') : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Export chart data types
export type { LineChartData, BarChartData, PieChartData, ActivityData };