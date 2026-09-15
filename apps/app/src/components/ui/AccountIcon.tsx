import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { accountIconColor, accountIconName } from '@/lib/accountIcon';
import type { AccountType } from '@/types/models';

type Size = 'sm' | 'md';
const BOX: Record<Size, number> = { sm: 32, md: 40 };
const ICON: Record<Size, number> = { sm: 15, md: 18 };

/** Círculo colorido por tipo de conta — mesmo padrão do `CategoryIcon`. */
export function AccountIcon({ type, size = 'md' }: { type: AccountType; size?: Size }) {
  const box = BOX[size];
  return (
    <View
      style={{
        width: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: accountIconColor(type),
      }}
      className="items-center justify-center"
    >
      <Feather name={accountIconName(type)} size={ICON[size]} color="#fff" />
    </View>
  );
}
