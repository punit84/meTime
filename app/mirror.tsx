import { useRouter } from 'expo-router';
import { FeaturePlaceholder } from '@/components/FeaturePlaceholder';
import { FEATURE_ACTIONS } from '@/lib/content';
import { images } from '@/lib/images';
import { colors } from '@/lib/theme';

export default function MirrorScreen() {
  const router = useRouter();

  return (
    <FeaturePlaceholder
      tag="REFLECTION"
      title="Mirror"
      subtitle="See yourself. Be with yourself."
      hero={images.mirror.hero}
      actions={FEATURE_ACTIONS.mirror}
      moodWash={colors.surfaceRose}
      actionIcon="camera-outline"
      reflection={{
        quote: 'Look into your own eyes with kindness. You are allowed to simply be here.',
        sub: 'A private space for emotion release, calm breathing, and gentle self-presence.',
      }}
      onActionPress={(action) => {
        if (action.id === 'photo') {
          router.push({ pathname: '/mirror/camera', params: { mode: 'photo' } });
        } else if (action.id === 'video') {
          router.push({ pathname: '/mirror/camera', params: { mode: 'video' } });
        } else if (action.id === 'gallery') {
          router.push('/mirror/gallery');
        }
      }}
    />
  );
}
