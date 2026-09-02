import { Switch, View } from 'react-native';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** Toggle rotulado. */
export function SwitchField({ label, hint, value, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1">
        <Text variant="label">{label}</Text>
        {hint ? (
          <Text variant="muted" className="text-xs">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: '#0f9d58' }}
      />
    </View>
  );
}
