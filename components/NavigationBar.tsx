import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type TabDescriptor = {
  options: {
    title?: string;
    tabBarAccessibilityLabel?: string;
  };
};

type Props = {
  state: {
    routes: TabRoute[];
    index: number;
  };
  descriptors: Record<string, TabDescriptor>;
  // Expo Router / React Navigation tab bar props — kept loose for SDK typing.
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const ICONS: Record<
  string,
  {
    active: keyof typeof Ionicons.glyphMap;
    idle: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  index: { active: 'home', idle: 'home-outline', label: 'Home' },
  'my-space': { active: 'heart', idle: 'heart-outline', label: 'My Space' },
  explore: { active: 'compass', idle: 'compass-outline', label: 'Explore' },
  listen: {
    active: 'musical-notes',
    idle: 'musical-notes-outline',
    label: 'Listen',
  },
  settings: {
    active: 'settings',
    idle: 'settings-outline',
    label: 'Settings',
  },
};

export function NavigationBar({
  state,
  descriptors,
  navigation,
}: {
  state: Props['state'];
  descriptors: Props['descriptors'];
  navigation: any;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.bar} accessibilityRole="tablist">
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const meta = ICONS[route.name] ?? {
              active: 'ellipse' as const,
              idle: 'ellipse-outline' as const,
              label: options.title ?? route.name,
            };
            const label = options.tabBarAccessibilityLabel ?? meta.label;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={styles.item}
              >
                <View style={[styles.pill, focused && styles.pillActive]}>
                  <Ionicons
                    name={focused ? meta.active : meta.idle}
                    size={20}
                    color={focused ? colors.accentDeep : colors.icon}
                  />
                </View>
                <AppText
                  style={[styles.label, focused && styles.labelActive]}
                  numberOfLines={1}
                >
                  {meta.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    width: '100%',
    maxWidth: 540,
    paddingHorizontal: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.navigation,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadows.nav,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 48,
  },
  pill: {
    width: 40,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.navigationActive,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.bodyMedium,
    color: colors.accentDeep,
  },
});
