import { Tabs } from 'expo-router';
import { NavigationBar } from '@/components/NavigationBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <NavigationBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="my-space"
        options={{
          title: 'My Space',
          tabBarAccessibilityLabel: 'My Space',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore',
        }}
      />
      <Tabs.Screen
        name="listen"
        options={{
          title: 'Listen',
          tabBarAccessibilityLabel: 'Listen',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}
