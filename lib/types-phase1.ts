import type { ImageSourcePropType } from 'react-native';
import type { Href } from 'expo-router';

export type MoodId = 'happy' | 'sad' | 'calm' | 'uneasy' | 'glow';

export type MoodConfig = {
  id: MoodId;
  title: string;
  description: string;
  icon: 'sunny-outline' | 'rainy-outline' | 'leaf-outline' | 'cloudy-outline' | 'sparkles-outline';
  wash: string;
  accent: string;
};

export type NeedId = 'mirror' | 'skin-care' | 'write' | 'listen' | 'soft-talk' | 'games';

export type NeedConfig = {
  id: NeedId;
  title: string;
  description: string;
  href: Href;
  image: ImageSourcePropType;
  size: 'large' | 'small';
};
