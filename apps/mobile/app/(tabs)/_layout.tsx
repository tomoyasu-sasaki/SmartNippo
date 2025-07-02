import { LAYOUT_CONSTANTS } from '@smartnippo/lib';
import { Tabs } from 'expo-router';
import { FileText, Home, User } from 'lucide-react-native';
import { AuthGuard } from '../../components/layouts/auth-guard';

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name='dashboard'
          options={{
            title: LAYOUT_CONSTANTS.NAV_LINKS.DASHBOARD,
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name='reports'
          options={{
            title: LAYOUT_CONSTANTS.NAV_LINKS.REPORTS,
            tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            title: LAYOUT_CONSTANTS.NAV_LINKS.PROFILE,
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
