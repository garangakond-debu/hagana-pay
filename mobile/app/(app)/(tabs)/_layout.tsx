import { Tabs } from 'expo-router';
import { View } from 'react-native';
import {
  HouseIcon,
  WalletIcon,
  ReceiptTextIcon,
  UserRoundIcon,
} from 'lucide-react-native';
import { cssInterop, useColorScheme } from 'nativewind';

cssInterop(HouseIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(WalletIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ReceiptTextIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(UserRoundIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

/* Bottom nav pill: dark green background, border radius 30, width 75%, centered.
   Active tab gets a filled gold circular button with a white icon.
   Inactive tabs show the icon in white at reduced opacity. */
function TabIcon({
  focused,
  Icon,
}: {
  focused: boolean;
  Icon: React.ComponentType<{ size?: number }>;
}) {
  if (focused) {
    return (
      <View
        className="items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#F5C842',
        }}
      >
        <Icon size={21} color="#0D5C2E" />
      </View>
    );
  }
  return <Icon size={22} color="rgba(255,255,255,0.72)" />;
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 18,
          left: '12.5%',
          right: '12.5%',
          width: '75%',
          height: 62,
          backgroundColor: '#0D5C2E',
          borderRadius: 30,
          borderTopWidth: 0,
          borderWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 6,
        },
        tabBarActiveTintColor: '#F5C842',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.72)',
        tabBarShowLabel: false,
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={HouseIcon} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Pay',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={WalletIcon} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={ReceiptTextIcon} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={UserRoundIcon} />,
        }}
      />
    </Tabs>
  );
}
