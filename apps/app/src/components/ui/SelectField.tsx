import { type ReactNode, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
  searchable?: boolean;
  /** Ícone/avatar por opção (ex.: `CategoryIcon`) — telas tipo Mobills mostram cor/ícone na lista. */
  renderIcon?: (option: SelectOption) => ReactNode;
  /** `chip` — pill compacta (categoria/conta no lançamento), sem label acima nem largura cheia. */
  variant?: 'field' | 'chip';
  /**
   * Cor da borda/texto do chip — hex literal (via `style`, não classe
   * Tailwind: precisa funcionar com cor calculada em runtime, ex. por tipo
   * de conta). Só usado em `variant="chip"`.
   */
  chipToneColor?: string;
};

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Select rotulado — toca e escolhe numa bottom sheet (o app não tem `<select>`). */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  error,
  searchable = false,
  renderIcon,
  variant = 'field',
  chipToneColor,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((o) => o.value === value);
  const isChip = variant === 'chip';

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const normalized = normalizeText(search.trim());
    return options.filter((opt) => normalizeText(opt.label).includes(normalized));
  }, [options, search, searchable]);

  const handleClose = () => {
    setOpen(false);
    setSearch('');
  };

  return (
    <View className={isChip ? 'items-start gap-1.5' : 'gap-1.5'}>
      {isChip ? null : <Text variant="label">{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        style={isChip ? { borderColor: chipToneColor ?? '#7c918b' } : undefined}
        className={cn(
          isChip
            ? 'h-10 max-w-full flex-row items-center gap-2 self-start rounded-full border px-3'
            : cn(
                'h-12 flex-row items-center justify-between rounded-xl border border-line bg-surface px-3',
                error && 'border-negative',
              ),
        )}
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {selected && renderIcon ? renderIcon(selected) : null}
          <Text
            style={isChip ? { color: chipToneColor ?? '#7c918b' } : undefined}
            className={cn(!isChip && (selected ? 'text-fg' : 'text-fg-subtle'))}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Feather
          name="chevron-down"
          size={16}
          color={isChip ? (chipToneColor ?? '#7c918b') : '#7c918b'}
        />
      </Pressable>
      {error ? <Text variant="error">{error}</Text> : null}

      <Sheet open={open} onClose={handleClose} title={label}>
        <View className="gap-3">
          {searchable ? (
            <TextInput
              placeholder={t.common.search}
              placeholderTextColor="#7c918b"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              className="h-12 rounded-xl border border-line bg-surface px-3 text-base text-fg"
            />
          ) : null}
          <View>
            {filteredOptions.length === 0 ? (
              <Text variant="muted" className="py-4 text-center">
                {t.common.noResults}
              </Text>
            ) : (
              filteredOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    handleClose();
                  }}
                  className="flex-row items-center justify-between border-b border-line py-3 active:bg-surface-2"
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-3">
                    {renderIcon ? renderIcon(option) : null}
                    <Text
                      className={cn(
                        'min-w-0 flex-1',
                        option.value === value && 'font-semibold text-brand-600',
                      )}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {option.value === value ? (
                    <Feather name="check" size={18} color="#0f9d58" />
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
        </View>
      </Sheet>
    </View>
  );
}
