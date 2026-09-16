import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { CATEGORY_ICON_CHOICES, type FeatherName } from '@/lib/categoryIcon';
import { t } from '@/i18n';

const VISIBLE_COUNT = 5;

/**
 * Seletor de ícone da categoria — conjunto fixo de `CATEGORY_ICON_CHOICES`,
 * mesma paginação "5 + Outros…" do {@see ColorSwatchPicker}. O ícone
 * selecionado usa `tint` (a cor escolhida no picker ao lado) como fundo,
 * pra pré-visualizar como vai ficar o círculo da categoria.
 */
export function IconSwatchPicker({
  value,
  onChange,
  tint,
}: {
  value: FeatherName;
  onChange: (icon: FeatherName) => void;
  tint: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? CATEGORY_ICON_CHOICES : CATEGORY_ICON_CHOICES.slice(0, VISIBLE_COUNT);

  return (
    <View className="gap-2">
      <Text variant="label">{t.categories.icon}</Text>
      <View className="flex-row flex-wrap items-center gap-2">
        {visible.map((icon) => {
          const selected = value === icon;
          return (
            <Pressable
              key={icon}
              accessibilityLabel={icon}
              onPress={() => onChange(icon)}
              style={{ backgroundColor: selected ? tint : '#94a3b8' }}
              className="size-9 items-center justify-center rounded-full"
            >
              <Feather name={icon} size={16} color="#fff" />
            </Pressable>
          );
        })}
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
