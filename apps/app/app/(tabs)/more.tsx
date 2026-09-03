import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TabShell } from '@/components/TabShell';
import { ConfirmSheet, ListRow, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type ThemePref } from '@/store/themeStore';

type Item = { label: string; icon: keyof typeof Feather.glyphMap; href?: Href };

// `href` ausente = tela ainda não construída (próximos PRs do trilho B).
const MANAGE: Item[] = [
  { label: t.nav.accounts, icon: 'credit-card', href: '/accounts' },
  { label: t.nav.categories, icon: 'tag', href: '/categories' },
  { label: t.nav.budgets, icon: 'pie-chart', href: '/budgets' },
  { label: t.nav.goals, icon: 'target' },
  { label: t.nav.debts, icon: 'users' },
  { label: t.nav.bills, icon: 'file-text' },
];

const THEMES: { value: ThemePref; label: string }[] = [
  { value: 'light', label: t.theme.light },
  { value: 'dark', label: t.theme.dark },
  { value: 'system', label: t.theme.system },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-1">
      <Text variant="muted" className="text-xs uppercase tracking-wide">
        {title}
      </Text>
      <View className="rounded-2xl border border-line bg-surface">{children}</View>
    </View>
  );
}

export default function MoreTab() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const pref = useThemeStore((s) => s.pref);
  const setPref = useThemeStore((s) => s.setPref);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <TabShell title={t.nav.more}>
      <View className="gap-6">
        <Section title={t.more.manage}>
          {MANAGE.map((item) => (
            <ListRow
              key={item.label}
              onPress={item.href ? () => router.push(item.href!) : undefined}
            >
              <View
                className={cn('flex-row items-center gap-3', !item.href && 'opacity-40')}
              >
                <Feather name={item.icon} size={18} color="#7c918b" />
                <Text className="flex-1">{item.label}</Text>
                {item.href ? (
                  <Feather name="chevron-right" size={18} color="#7c918b" />
                ) : (
                  <Text variant="muted" className="text-xs">
                    {t.more.soon}
                  </Text>
                )}
              </View>
            </ListRow>
          ))}
        </Section>

        <Section title={t.theme.label}>
          <View className="flex-row gap-1 p-2">
            {THEMES.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setPref(option.value)}
                className={cn(
                  'flex-1 items-center rounded-lg py-2',
                  pref === option.value ? 'bg-canvas' : '',
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    pref === option.value ? 'font-semibold text-fg' : 'text-fg-muted',
                  )}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Pressable
          onPress={() => setConfirmLogout(true)}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 active:bg-surface-2"
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text className="font-medium text-negative">{t.nav.logout}</Text>
        </Pressable>
      </View>

      <ConfirmSheet
        open={confirmLogout}
        title={t.nav.logout}
        message={t.more.logoutConfirm}
        confirmLabel={t.nav.logout}
        tone="danger"
        onConfirm={() => {
          setConfirmLogout(false);
          clearSession();
          router.replace('/login');
        }}
        onClose={() => setConfirmLogout(false)}
      />
    </TabShell>
  );
}
