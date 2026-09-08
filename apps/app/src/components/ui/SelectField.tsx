import { useMemo, useState } from 'react';
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
};

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Select rotulado — toca e escolhe numa bottom sheet (o app não tem `<select>`). */
export function SelectField({ label, value, options, onChange, placeholder, error, searchable = false }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = options.find((o) => o.value === value);

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
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'h-12 flex-row items-center justify-between rounded-xl border border-line bg-surface px-3',
          error && 'border-negative',
        )}
      >
        <Text className={cn(selected ? 'text-fg' : 'text-fg-subtle')} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color="#7c918b" />
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
                  <Text className={cn(option.value === value && 'font-semibold text-brand-600')}>
                    {option.label}
                  </Text>
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
