import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { colors, fonts, radii, shadows, spacing } from '@/lib/theme';
import type { NeedConfig } from '@/lib/types-phase1';

function GoButton() {
  return (
    <View style={styles.go}>
      <Ionicons name="arrow-forward" size={14} color={colors.white} />
    </View>
  );
}

type CardProps = {
  title: string;
  description: string;
  image: ImageSourcePropType;
  onPress: () => void;
  large?: boolean;
};

export function ImageFeatureCard({
  title,
  description,
  image,
  onPress,
  large = false,
}: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={({ pressed }) => [
        large ? styles.largeCard : styles.smallCard,
        pressed && styles.pressed,
      ]}
    >
      <Image source={image} style={large ? styles.largeImage : styles.smallImage} />
      <View style={styles.copy}>
        <AppText style={[styles.title, large && styles.titleLarge]}>{title}</AppText>
        <AppText muted style={styles.desc} numberOfLines={2}>
          {description}
        </AppText>
      </View>
      <GoButton />
    </Pressable>
  );
}

type NeedSectionProps = {
  needs: NeedConfig[];
};

export function NeedSection({ needs }: NeedSectionProps) {
  const router = useRouter();
  const large = needs.filter((n) => n.size === 'large');
  const small = needs.filter((n) => n.size === 'small');

  return (
    <View style={styles.section}>
      <View style={styles.largeRow}>
        {large.map((need) => (
          <View key={need.id} style={styles.largeWrap}>
            <ImageFeatureCard
              large
              title={need.title}
              description={need.description}
              image={need.image}
              onPress={() => router.push(need.href)}
            />
          </View>
        ))}
      </View>
      <View style={styles.smallRow}>
        {small.map((need) => (
          <View key={need.id} style={styles.smallWrap}>
            <ImageFeatureCard
              title={need.title}
              description={need.description}
              image={need.image}
              onPress={() => router.push(need.href)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  largeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  largeWrap: { flex: 1 },
  smallRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallWrap: { flex: 1 },
  largeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.md,
    ...shadows.soft,
  },
  smallCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.sm,
    ...shadows.soft,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  largeImage: {
    width: '100%',
    height: 118,
  },
  smallImage: {
    width: '100%',
    height: 78,
  },
  copy: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 72,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  titleLarge: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
  },
  go: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
