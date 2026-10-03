import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export default function WriteScreen() {
  return (
    <FeaturePlaceholder
      tag="JOURNAL"
      title="Write"
      subtitle="Put your thoughts somewhere safe."
      hero={images.write.hero}
      actions={FEATURE_ACTIONS.write}
      moodWash={colors.surfacePeach}
      actionIcon="create-outline"
      reflection={{
        quote: 'Unspoken thoughts find a safe harbor here. Write without judgment.',
        sub: 'Private pages, voice notes, and quiet reflections held gently.',
      }}
    />
  );
}
