import { TextInput, View } from 'react-native';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { Text } from '@/components/ui/Text';

/**
 * Valor em destaque no topo do formulário, estilo "calculadora" do Mobills
 * — o mesmo parsing de dígitos do `MoneyField`, só que como protagonista
 * visual em vez de um campo pequeno.
 */
export function AmountHero({
  value,
  onChange,
  toneClassName,
  error,
}: {
  value: number;
  onChange: (value: number) => void;
  toneClassName: string;
  error?: string | null;
}) {
  return (
    <View className="items-center gap-1 py-2">
      <TextInput
        keyboardType="number-pad"
        placeholderTextColor="#7c918b"
        value={formatMoney(value)}
        onChangeText={(raw) => {
          const digits = raw.replace(/\D/g, '');
          onChange(digits ? Number(digits) / 100 : 0);
        }}
        className={cn('w-full text-center text-4xl font-bold tabular-nums', toneClassName)}
      />
      {error ? (
        <Text variant="error" className="text-center">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
