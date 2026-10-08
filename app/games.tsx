import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS, type FeatureAction } from '@/lib/content';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export default function GamesScreen() {
  const router = useRouter();

  const handleActionPress = (action: FeatureAction) => {
    if (action.id === 'puzzle') {
      router.push('/games/puzzle');
      return;
    }
    if (action.id === 'memory') {
      router.push('/games/memory');
      return;
    }
    if (action.id === 'mood-match') {
      router.push('/games/mood-match');
      return;
    }
    if (action.id === 'bubble-pop') {
      router.push('/games/bubble-pop');
      return;
    }
    if (action.id === 'zen-breathing') {
      router.push('/games/zen-breathing');
      return;
    }
    if (action.id === 'number-flow') {
      router.push('/games/number-flow');
      return;
    }

    const message = 'Coming soon for a quiet, gentle pause.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.alert(`${action.title}\n\n${message}`);
      }
    } else {
      Alert.alert(action.title, message);
    }
  };

  return (
    <FeaturePlaceholder
      tag="PAUSE"
      title="Games"
      subtitle="Take a tiny break."
      hero={images.games.hero}
      actions={FEATURE_ACTIONS.games}
      moodWash={colors.surfaceLavender}
      actionIcon="game-controller-outline"
      onActionPress={handleActionPress}
      reflection={{
        quote: 'A peaceful mind plays for joy, not for achievement or haste.',
        sub: 'Gentle matching, quiet focus, and breathing resets without any pressure.',
      }}
    />
  );
}
