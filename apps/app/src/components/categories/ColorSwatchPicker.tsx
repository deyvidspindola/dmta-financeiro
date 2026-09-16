import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { CATEGORY_COLORS } from '@/lib/categoryColor';
import { t } from '@/i18n';

const VISIBLE_COUNT = 5;

/**
 * Seletor de cor da categoria — paleta fixa de `CATEGORY_COLORS`, mostra
 * as 5 primeiras e expande pro resto sob "Outros…" (mesmo padrão do
 * cadastro de categoria do Mobills, só que sem modal separado).
 */
export function ColorSwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? CATEGORY_COLORS : CATEGORY_COLORS.slice(0, VISIBLE_COUNT);

  return (
    <View className="gap-2">
      <Text variant="label">{t.categories.color}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        {visible.map((color) => (
          <Pressable
            key={color}
            accessibilityLabel={color}
            onPress={() => onChange(color)}
            style={{ backgroundColor: color }}
            className="size-9 items-center justify-center rounded-full"
          >
            {value === color ? <Feather name="check" size={16} color="#fff" /> : null}
          </Pressable>
        ))}
        {!expanded ? (
          <Pressable
            onPress={() => setExpanded(true)}
            className="rounded-full bg-surface-2 px-3 py-2"
          >
            <Text variant="muted" className="text-xs">
              {t.categories.pickerMore}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
