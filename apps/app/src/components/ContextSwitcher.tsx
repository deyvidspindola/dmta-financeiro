import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Badge, Text } from '@/components/ui';
import { t } from '@/i18n';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';

const ICON_COLORS = {
  light: { subtle: '#7c918b', positive: '#059669' },
  dark: { subtle: '#6b7f79', positive: '#34d399' },
} as const;

/** Troca de contexto PF/PJ + Consolidado — chip com menu modal. */
export function ContextSwitcher() {
  const { contexts, activeScope, setActiveScope } = useAuthStore();
  const [open, setOpen] = useState(false);
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? ICON_COLORS.dark : ICON_COLORS.light;

  const ordered = useMemo(
    () =>
      [...contexts].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR');
        return a.type === 'pf' ? -1 : 1;
      }),
    [contexts],
  );

  const activeContext =
    activeScope === CONSOLIDATED ? null : ordered.find((c) => c.id === activeScope);

  const currentLabel =
    activeScope === CONSOLIDATED ? t.nav.consolidated : (activeContext?.name ?? t.nav.context);

  const currentTag =
    activeScope === CONSOLIDATED ? null : activeContext?.type === 'pf' ? t.nav.pf : t.nav.pj;

  const currentTagTone = activeContext?.type === 'pf' ? 'brand' : 'accent';

  function pick(scope: string) {
    setActiveScope(scope);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-10 max-w-[10.5rem] flex-row items-center gap-2 rounded-xl border border-line bg-surface px-2.5 active:bg-surface-2"
      >
        {activeScope === CONSOLIDATED ? <Feather name="layers" size={14} color="#8b5cf6" /> : null}
        <Text className="min-w-0 flex-1 text-xs font-medium" numberOfLines={1}>
          {currentLabel}
        </Text>
        {currentTag ? (
          <Badge tone={currentTagTone} className="shrink-0">
            {currentTag}
          </Badge>
        ) : null}
        <Feather name="chevrons-up" size={14} color={palette.subtle} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setOpen(false)}>
          <View className="mt-16 px-4">
            <Pressable
              className="ml-auto max-h-[70%] w-64 overflow-hidden rounded-xl border border-line bg-surface"
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView>
                <View className="px-3 py-2">
                  <Text
                    variant="muted"
                    className="text-[10px] font-semibold uppercase tracking-wide"
                  >
                    {t.nav.consolidatedView}
                  </Text>
                </View>
                <Pressable
                  onPress={() => pick(CONSOLIDATED)}
                  className={`flex-row items-center justify-between px-3 py-2.5 active:bg-surface-2 ${
                    activeScope === CONSOLIDATED ? 'bg-brand-500/10' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Feather name="layers" size={16} color="#8b5cf6" />
                    <Text className="text-sm">{t.nav.consolidated}</Text>
                  </View>
                  {activeScope === CONSOLIDATED ? (
                    <Feather name="check" size={15} color={palette.positive} />
                  ) : null}
                </Pressable>

                <View className="my-1 border-t border-line" />

                <View className="px-3 py-2">
                  <Text
                    variant="muted"
                    className="text-[10px] font-semibold uppercase tracking-wide"
                  >
                    {t.nav.context}
                  </Text>
                </View>

                {ordered.map((ctx) => (
                  <Pressable
                    key={ctx.id}
                    onPress={() => pick(ctx.id)}
                    className={`flex-row items-center justify-between px-3 py-2.5 active:bg-surface-2 ${
                      activeScope === ctx.id ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                      <Text className="shrink text-sm" numberOfLines={1}>
                        {ctx.name}
                      </Text>
                      <Badge tone={ctx.type === 'pf' ? 'brand' : 'accent'}>
                        {ctx.type === 'pf' ? t.nav.pf : t.nav.pj}
                      </Badge>
                    </View>
                    {activeScope === ctx.id ? (
                      <Feather name="check" size={15} color={palette.positive} />
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
