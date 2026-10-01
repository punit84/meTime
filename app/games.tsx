import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';

export default function GamesScreen() {
  return (
    <FeaturePlaceholder
      title="Games"
      subtitle="Take a tiny break."
      hero={images.games.hero}
      actions={FEATURE_ACTIONS.games}
    />
  );
}
