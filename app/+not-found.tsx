import { Link, Stack, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={styles.wrap}>
        <AppText variant="title">This page drifted away</AppText>
        <AppText muted style={styles.copy}>
          Let’s go back to your little space.
        </AppText>
        <Link href={'/' as Href} style={styles.link}>
          <AppText style={styles.linkText}>Return home</AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  copy: { marginTop: spacing.sm, marginBottom: spacing.xl },
  link: { alignSelf: 'flex-start' },
  linkText: { color: colors.accentDeep, textDecorationLine: 'underline' },
});
