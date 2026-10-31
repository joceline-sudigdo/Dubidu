import { Tabs } from 'expo-router/tabs';

import { RoleTabBar } from '@/components/navigation/role-tab-bar';

export default function TeacherTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <RoleTabBar {...props} />}>
      <Tabs.Screen name="beranda" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="jadwal" />
      <Tabs.Screen name="riwayat" />
      <Tabs.Screen name="komunitas" />
    </Tabs>
  );
}
