import { ReactNode } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  padded?: boolean;
};

// Navigation bar base height (48 minHeight + 16 vertical padding + 2 border) ~ 66px
const TAB_BAR_BASE_HEIGHT = 66;

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  padded = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTabScreen = edges.includes('top') && padded;
  const navBottomInset = Math.max(insets.bottom, 12);
  const bottomPadding = isTabScreen
    ? TAB_BAR_BASE_HEIGHT + navBottomInset + spacing.lg
    : Math.max(insets.bottom, 16) + spacing.lg;

  // Responsive horizontal padding based on screen width
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const topPadding = edges.includes('top') && padded ? spacing.sm : 0;

  const body = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[
        {
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
        },
        padded && { paddingHorizontal: horizontalPadding },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.fill,
        { paddingTop: topPadding },
        padded && { paddingHorizontal: horizontalPadding },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, style]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={edges}>
        <View style={styles.container}>{body}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
  },
  fill: {
    flex: 1,
  },
});


