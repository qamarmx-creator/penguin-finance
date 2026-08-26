import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  const tabBarStyle = Platform.OS === 'web'
    ? { backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECECEC', height: 'auto' as any }
    : { backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECECEC' };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#CCCCCC',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '记账',
          tabBarIcon: ({ color }) => (
            <Feather name="edit-2" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '明细',
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '统计',
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
