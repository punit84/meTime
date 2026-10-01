import { Alert, StyleSheet } from 'react-native';
import { FeatureCard } from '@/components/FeatureCard';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { EXPLORE_ITEMS } from '@/lib/content';

export default function ExploreScreen() {
  return (
    <Screen>
      <PageHeader
        title="Explore"
        subtitle="Soft little corners to visit when you need a pause."
      />
      {EXPLORE_ITEMS.map((item) => (
        <FeatureCard
          key={item.id}
          title={item.title}
          subtitle={item.subtitle}
          image={item.image}
          wash={item.wash}
          onPress={() =>
            Alert.alert(item.title, 'Coming in a later phase.')
          }
        />
      ))}
    </Screen>
  );
}
