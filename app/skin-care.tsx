import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export default function SkinCareScreen() {
  return (
    <FeaturePlaceholder
      tag="RITUAL"
      title="Skin Care"
      subtitle="A little care goes a long way."
      hero={images.skincare.hero}
      actions={FEATURE_ACTIONS['skin-care']}
      moodWash={colors.surfaceSage}
      actionIcon="sparkles-outline"
      reflection={{
        quote: 'A gentle ritual for your skin, taken slowly and with peaceful presence.',
        sub: 'Soft care steps designed to soothe, nourish, and ground your body.',
      }}
    />
  );
}
