import { Calendar as CalendarIcon, CheckCircle, Edit, Hourglass } from 'lucide-react-native';
import { View } from 'react-native';
import { StatCard } from './StatCard';

export function StatsSection({ stats }: { stats: any }) {
  if (!stats) {
    return null;
  }

  return (
    <View className='flex-row flex-wrap mb-6'>
      <StatCard
        title='今月の日報'
        value={stats.reportsThisMonth}
        subtitle='作成済み'
        icon={CalendarIcon}
        iconColor='#6B7280'
      />
      <StatCard
        title='承認済み'
        value={stats.approvedThisMonth}
        subtitle='今月承認された日報'
        icon={CheckCircle}
        iconColor='#10B981'
      />
      <StatCard
        title='承認待ち'
        value={stats.pendingApproval}
        subtitle='承認を待っている日報'
        icon={Hourglass}
        iconColor='#F59E0B'
      />
      <StatCard
        title='下書き'
        value={stats.drafts}
        subtitle='保存されている下書き'
        icon={Edit}
        iconColor='#6B7280'
      />
    </View>
  );
}
