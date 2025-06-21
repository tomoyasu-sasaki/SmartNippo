import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <TabBarIcon name='list' color={color} />,
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name='user' color={color} />,
        }}
      />
    </Tabs>
  );
}

// Placeholder icon component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TabBarIcon({ name, color }: { name: string; color: string }) {
  return null; // Will be replaced with actual icons later
}
