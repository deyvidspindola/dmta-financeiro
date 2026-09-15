import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CalculatorKeypad } from '@/components/ui/CalculatorKeypad';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { Text } from '@/components/ui/Text';

/**
 * Valor em destaque, estilo "calculadora" do Mobills — toca e abre um
 * teclado numérico próprio (`CalculatorKeypad`), não o teclado nativo do
 * SO. `toneColor` é hex literal (o `CalculatorKeypad` usa em `style`, onde
 * classes Tailwind/tokens semânticos não chegam).
 */
export function AmountHero({
  label,
  value,
  onChange,
  toneClassName,
  toneColor,
  error,
}: {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  toneClassName: string;
  toneColor: string;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-1">
      {label ? (
        <Text variant="muted" className="text-sm">
          {label}
        </Text>
      ) : null}
      <Pressable onPress={() => setOpen(true)}>
        <Text className={cn('text-4xl font-bold tabular-nums', toneClassName)}>
          {formatMoney(value)}
        </Text>
      </Pressable>
      {error ? <Text variant="error">{error}</Text> : null}

      <CalculatorKeypad
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onConfirm={onChange}
        toneColor={toneColor}
        toneClassName={toneClassName}
      />
    </View>
  );
}
