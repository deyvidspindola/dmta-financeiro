import { TextInput, View } from 'react-native';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  /** Valor em reais (ex.: 1234.56). */
  value: number;
  onChange: (value: number) => void;
  error?: string | null;
};

/** Campo de valor com máscara pt-BR — usuário vê `R$ 1.234,56`, o form recebe número. */
export function MoneyField({ label, value, onChange, error }: Props) {
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <TextInput
        keyboardType="number-pad"
        placeholderTextColor="#7c918b"
        className={cn(
          'h-12 rounded-xl border border-line bg-surface px-3 text-base tabular-nums text-fg',
          error && 'border-negative',
        )}
        value={formatMoney(value)}
        onChangeText={(raw) => {
          const digits = raw.replace(/\D/g, '');
          onChange(digits ? Number(digits) / 100 : 0);
        }}
      />
      {error ? <Text variant="error">{error}</Text> : null}
    </View>
  );
}
