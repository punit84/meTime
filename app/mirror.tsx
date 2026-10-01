import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';

export default function MirrorScreen() {
  return (
    <FeaturePlaceholder
      title="Mirror"
      subtitle="See yourself. Be with yourself."
      hero={images.mirror.hero}
      actions={FEATURE_ACTIONS.mirror}
    />
  );
}
