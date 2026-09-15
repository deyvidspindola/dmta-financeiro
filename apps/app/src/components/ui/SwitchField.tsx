import { Switch, View } from 'react-native';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Cor da trilha quando ligado — hex literal (Switch não lê classe Tailwind). */
  toneColor?: string;
};

/** Toggle rotulado. */
export function SwitchField({ label, hint, value, onChange, toneColor }: Props) {
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
        trackColor={{ false: '#767577', true: toneColor ?? '#0f9d58' }}
        thumbColor="#fff"
        ios_backgroundColor="#767577"
      />
    </View>
  );
}
