import { ReactNode } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/lib/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  padded?: boolean;
};

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  padded = true,
}: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[
        padded && styles.padded,
        styles.scrollBottom,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, style]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.fill} edges={edges}>
        {body}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollBottom: {
    paddingBottom: spacing.xxl + 28,
    paddingTop: spacing.sm,
  },
});
