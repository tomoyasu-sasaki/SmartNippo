'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartDataPoint {
  date: string;
  submitted: number;
  approved: number;
}

interface ReportsChartProps {
  data: ChartDataPoint[];
}

export function ReportsChart({ data }: ReportsChartProps) {
  const { resolvedTheme } = useTheme();

  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => format(new Date(d.date), 'M/d', { locale: ja })),
    datasets: [
      {
        label: '提出済み',
        data: data.map((d) => d.submitted),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        stack: 'Stack 0',
      },
      {
        label: '承認済み',
        data: data.map((d) => d.approved),
        backgroundColor: 'rgba(22, 163, 74, 0.5)',
        borderColor: 'rgba(22, 163, 74, 1)',
        borderWidth: 1,
        stack: 'Stack 0',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: resolvedTheme === 'dark' ? '#fff' : '#000',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: resolvedTheme === 'dark' ? '#fff' : '#000',
        },
        grid: {
          color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: resolvedTheme === 'dark' ? '#fff' : '#000',
          stepSize: 1,
        },
        grid: {
          color: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
}
