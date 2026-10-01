import { Alert, ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SpaceRow } from '@/components/FeatureCard';
import { SPACE_ITEMS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors, radii, spacing } from '@/lib/theme';

export default function MySpaceScreen() {
  return (
    <Screen>
      <View style={styles.heroBlock}>
        <ImageBackground
          source={images.myspace.journal}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <LinearGradient
            colors={['rgba(246,241,234,0.2)', colors.background]}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
        <PageHeader
          title="My Space"
          subtitle="Your private collection of moments, pages, and soft keepsakes."
        />
      </View>

      {SPACE_ITEMS.map((item) => (
        <SpaceRow
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          image={item.image}
          onPress={() =>
            Alert.alert(item.title, 'Coming in a later phase.')
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    marginBottom: spacing.md,
  },
  hero: {
    height: 120,
    marginBottom: spacing.md,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: radii.lg,
    opacity: 0.55,
  },
});
