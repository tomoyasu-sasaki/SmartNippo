import { REPORT_STATUS_LABELS } from '@smartnippo/lib';
import { CheckCircle, Clock, XCircle } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export const getStatusStyle = (status: string) => {
  switch (status) {
    case 'draft':
      return { color: 'bg-gray-100 text-gray-600', icon: null };
    case 'submitted':
      return { color: 'bg-blue-100 text-blue-600', icon: <Clock size={16} color='#2563EB' /> };
    case 'approved':
      return {
        color: 'bg-green-100 text-green-600',
        icon: <CheckCircle size={16} color='#16A34A' />,
      };
    case 'rejected':
      return { color: 'bg-red-100 text-red-600', icon: <XCircle size={16} color='#DC2626' /> };
    default:
      return { color: 'bg-gray-100 text-gray-600', icon: null };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = false }) => {
  const statusStyle = getStatusStyle(status);
  const statusLabel = REPORT_STATUS_LABELS[status as keyof typeof REPORT_STATUS_LABELS] || status;

  return (
    <View className={`flex-row items-center rounded-full px-3 py-1 ${statusStyle.color}`}>
      {showIcon && statusStyle.icon}
      <Text className={`${showIcon && statusStyle.icon ? 'ml-1' : ''} text-sm font-medium`}>
        {statusLabel}
      </Text>
    </View>
  );
};
