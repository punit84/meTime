import { images } from '@/lib/images';
import type { NeedConfig } from '@/lib/types-phase1';

export const NEEDS: NeedConfig[] = [
  {
    id: 'mirror',
    title: 'Mirror',
    description: 'See yourself. Be with yourself.',
    href: '/mirror',
    image: images.home.mirror,
    size: 'large',
  },
  {
    id: 'skin-care',
    title: 'Skin Care',
    description: 'A little care goes a long way.',
    href: '/skin-care',
    image: images.home.skincare,
    size: 'large',
  },
  {
    id: 'write',
    title: 'Write',
    description: 'Put your thoughts somewhere safe.',
    href: '/write',
    image: images.home.write,
    size: 'small',
  },
  {
    id: 'listen',
    title: 'Listen',
    description: 'Find something that fits the moment.',
    href: '/listen',
    image: images.home.listen,
    size: 'small',
  },
  {
    id: 'soft-talk',
    title: 'Soft Talk',
    description: 'Say what you need to say.',
    href: '/soft-talk',
    image: images.home.softTalk,
    size: 'small',
  },
  {
    id: 'games',
    title: 'Games',
    description: 'Take a tiny break.',
    href: '/games',
    image: images.home.games,
    size: 'small',
  },
];
