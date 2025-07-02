'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { useTheme } from 'next-themes';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ReportsChartProps<T extends object> {
  data: T[];
  chartType: 'bar' | 'line';
  dataKey: keyof T;
  xAxisKey: keyof T;
  tooltipLabel: string;
  unit?: string;
  yAxisTicks?: number[];
  yAxisTickFormatter?: (value: string | number) => string;
}

export function ReportsChart<T extends object>({
  data,
  chartType,
  dataKey,
  xAxisKey,
  tooltipLabel,
  unit = '',
  yAxisTicks,
  yAxisTickFormatter,
}: ReportsChartProps<T>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#fff' : '#000';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const primaryColor = 'rgba(59, 130, 246, 1)';
  const primaryColorBg = 'rgba(59, 130, 246, 0.5)';

  const chartData: ChartData<typeof chartType> = {
    labels: data.map((d) => format(parseISO(d[xAxisKey] as string), 'M/d')),
    datasets: [
      {
        label: tooltipLabel,
        data: data.map((d) => d[dataKey] as number),
        backgroundColor: chartType === 'line' ? primaryColorBg : primaryColor,
        borderColor: primaryColor,
        borderWidth: chartType === 'line' ? 2 : 1,
        fill: chartType === 'line' ? 'start' : false,
        tension: 0.3,
        pointBackgroundColor: primaryColor,
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<typeof chartType> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // シンプルにするため凡例は非表示
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label ?? '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y}${unit}`;
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          ...(yAxisTicks && { stepSize: yAxisTicks[1] - yAxisTicks[0] }),
          ...(yAxisTickFormatter && {
            callback: (tickValue) => yAxisTickFormatter(tickValue),
          }),
        },
        grid: { color: gridColor },
      },
    },
  };

  const ChartComponent = chartType === 'line' ? Line : Bar;

  return (
    <div style={{ height: '250px' }}>
      <ChartComponent options={options} data={chartData as any} />
    </div>
  );
}
