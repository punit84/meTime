import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';

export default function WriteScreen() {
  return (
    <FeaturePlaceholder
      title="Write"
      subtitle="Put your thoughts somewhere safe."
      hero={images.write.hero}
      actions={FEATURE_ACTIONS.write}
    />
  );
}
