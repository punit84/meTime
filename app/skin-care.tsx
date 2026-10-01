import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';

export default function SkinCareScreen() {
  return (
    <FeaturePlaceholder
      title="Skin Care"
      subtitle="A little care goes a long way."
      hero={images.skincare.hero}
      actions={FEATURE_ACTIONS['skin-care']}
    />
  );
}
