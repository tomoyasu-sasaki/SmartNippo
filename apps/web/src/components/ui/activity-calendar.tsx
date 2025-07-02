'use client';

import { useTheme } from 'next-themes';
import ActivityCalendar, { type Activity, type ThemeInput } from 'react-activity-calendar';

export interface ActivityCalendarProps {
  data: Activity[];
}

export function CustomActivityCalendar({ data }: ActivityCalendarProps) {
  const { theme } = useTheme();

  const colorTheme: ThemeInput = {
    light: ['hsl(0 0% 95%)', '#0969da'],
    dark: ['hsl(240 4% 16%)', '#0969da'],
  };

  return (
    <ActivityCalendar
      data={data}
      theme={colorTheme}
      colorScheme={theme === 'dark' ? 'dark' : 'light'}
      blockSize={20}
      blockMargin={10}
      blockRadius={10}
      showWeekdayLabels
      hideColorLegend
      hideTotalCount
    />
  );
}
