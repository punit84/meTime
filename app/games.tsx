import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export default function GamesScreen() {
  return (
    <FeaturePlaceholder
      tag="PAUSE"
      title="Games"
      subtitle="Take a tiny break."
      hero={images.games.hero}
      actions={FEATURE_ACTIONS.games}
      moodWash={colors.surfaceLavender}
      actionIcon="game-controller-outline"
      reflection={{
        quote: 'A peaceful mind plays for joy, not for achievement or haste.',
        sub: 'Gentle matching, color play, and breathing resets without any pressure.',
      }}
    />
  );
}
