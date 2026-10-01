import { Alert } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SettingsRow } from '@/components/SettingsRow';
import { SETTINGS_ITEMS } from '@/lib/content';

export default function SettingsScreen() {
  return (
    <Screen>
      <PageHeader
        title="Settings"
        subtitle="Keep this space gentle, private, and yours."
      />
      {SETTINGS_ITEMS.map((item) => (
        <SettingsRow
          key={item.id}
          item={item}
          onPress={() =>
            Alert.alert(item.title, 'Coming in a later phase.')
          }
        />
      ))}
    </Screen>
  );
}
