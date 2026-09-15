import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Text } from '@/components/ui/Text';

type Op = '+' | '-' | '×' | '÷';

function applyOp(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? a : a / b;
  }
}

function parseDisplay(display: string): number {
  return Number(display.replace(',', '.')) || 0;
}

function formatResult(n: number): string {
  // até 2 casas, sem separador de milhar — é o buffer de digitação, não o
  // valor "bonito" (isso quem mostra é o `formatMoney` no AmountHero).
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace('.', ',');
}

function initialDisplay(value: number): string {
  if (value === 0) return '0';
  return formatResult(value);
}

const DIGIT_ROWS: readonly (readonly [string, string, string, Op])[] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
];

/**
 * Teclado numérico próprio (estilo calculadora do Mobills) — substitui o
 * teclado nativo do SO na entrada de valor. Digitação livre com decimal
 * (não desloca centavos como o `MoneyField`): "3224" vira R$ 3.224,00.
 */
export function CalculatorKeypad({
  open,
  onClose,
  value,
  onConfirm,
  toneColor,
  toneClassName,
}: {
  open: boolean;
  onClose: () => void;
  value: number;
  onConfirm: (value: number) => void;
  toneColor: string;
  toneClassName: string;
}) {
  const [display, setDisplay] = useState(() => initialDisplay(value));
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [resetOnNextDigit, setResetOnNextDigit] = useState(false);

  // Reinicia o buffer sempre que o sheet abre — "ajustar estado quando uma
  // prop muda" durante a renderização (React sanciona esse padrão pra
  // resetar estado sem efeito: https://react.dev/learn/you-might-not-need-an-effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDisplay(initialDisplay(value));
      setAccumulator(null);
      setPendingOp(null);
      setResetOnNextDigit(false);
    }
  }

  function pressDigit(d: string) {
    if (d === ',') {
      if (resetOnNextDigit) {
        setDisplay('0,');
        setResetOnNextDigit(false);
        return;
      }
      if (display.includes(',')) return;
      setDisplay(display + ',');
      return;
    }
    if (resetOnNextDigit) {
      setDisplay(d);
      setResetOnNextDigit(false);
      return;
    }
    if (display === '0') {
      setDisplay(d);
      return;
    }
    if (display.replace(',', '').length >= 12) return;
    setDisplay(display + d);
  }

  function pressOp(op: Op) {
    const current = parseDisplay(display);
    if (pendingOp !== null && !resetOnNextDigit) {
      const result = applyOp(accumulator ?? 0, pendingOp, current);
      setAccumulator(result);
      setDisplay(formatResult(result));
    } else {
      setAccumulator(current);
    }
    setPendingOp(op);
    setResetOnNextDigit(true);
  }

  function pressEquals() {
    if (pendingOp === null) return;
    const current = parseDisplay(display);
    const result = applyOp(accumulator ?? 0, pendingOp, current);
    setDisplay(formatResult(result));
    setAccumulator(null);
    setPendingOp(null);
    setResetOnNextDigit(true);
  }

  function pressBackspace() {
    if (resetOnNextDigit) return;
    if (display.length <= 1) {
      setDisplay('0');
      return;
    }
    setDisplay(display.slice(0, -1));
  }

  function confirm() {
    let current = parseDisplay(display);
    if (pendingOp !== null) current = applyOp(accumulator ?? 0, pendingOp, current);
    onConfirm(Math.abs(current));
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <SafeAreaView edges={['bottom']} className="bg-canvas">
          <View className="rounded-t-3xl bg-surface-2 px-5 pb-4 pt-3">
            <View className="mb-3 items-center">
              <View className="h-1 w-10 rounded-full bg-line" />
            </View>

            <View className="mb-3 flex-row items-center justify-between border-b border-line pb-3">
              <Text variant="muted" className="text-base">
                R$
              </Text>
              <Text
                className={cn('flex-1 text-right text-3xl font-bold tabular-nums', toneClassName)}
              >
                {display}
              </Text>
              <Pressable onPress={pressBackspace} hitSlop={8} className="ml-3 p-1">
                <Feather name="delete" size={20} color="#7c918b" />
              </Pressable>
            </View>

            <View className="gap-2">
              {DIGIT_ROWS.map((row) => (
                <View key={row.join()} className="flex-row gap-2">
                  {row.slice(0, 3).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => pressDigit(d)}
                      className="h-14 flex-1 items-center justify-center active:bg-surface"
                    >
                      <Text className="text-2xl font-medium">{d}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    onPress={() => pressOp(row[3])}
                    className={cn(
                      'h-14 flex-1 items-center justify-center rounded-2xl bg-surface active:opacity-70',
                      pendingOp === row[3] && !resetOnNextDigit && 'bg-line',
                    )}
                  >
                    <Text className="text-xl font-semibold">{row[3]}</Text>
                  </Pressable>
                </View>
              ))}
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => pressDigit('0')}
                  className="h-14 flex-1 items-center justify-center active:bg-surface"
                >
                  <Text className="text-2xl font-medium">0</Text>
                </Pressable>
                <Pressable
                  onPress={() => pressDigit(',')}
                  className="h-14 flex-1 items-center justify-center active:bg-surface"
                >
                  <Text className="text-2xl font-medium">,</Text>
                </Pressable>
                <Pressable
                  onPress={pressEquals}
                  className="h-14 flex-1 items-center justify-center rounded-2xl active:opacity-80"
                  style={{ backgroundColor: toneColor }}
                >
                  <Text className="text-xl font-semibold text-white">=</Text>
                </Pressable>
                <Pressable
                  onPress={() => pressOp('+')}
                  className={cn(
                    'h-14 flex-1 items-center justify-center rounded-2xl bg-surface active:opacity-70',
                    pendingOp === '+' && !resetOnNextDigit && 'bg-line',
                  )}
                >
                  <Text className="text-xl font-semibold">+</Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="h-12 flex-1 items-center justify-center rounded-full border"
                style={{ borderColor: toneColor }}
              >
                <Text className="text-sm font-semibold" style={{ color: toneColor }}>
                  {t.common.cancel.toUpperCase()}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                className="h-12 flex-1 items-center justify-center rounded-full"
                style={{ backgroundColor: toneColor }}
              >
                <Text className="text-sm font-semibold text-white">
                  {t.common.done.toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
