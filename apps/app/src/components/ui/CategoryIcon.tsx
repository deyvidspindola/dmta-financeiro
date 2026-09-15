import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { categoryColor } from '@/lib/categoryColor';
import { categoryIconName } from '@/lib/categoryIcon';

type Size = 'sm' | 'md' | 'lg';
const BOX: Record<Size, number> = { sm: 28, md: 36, lg: 48 };
const ICON: Record<Size, number> = { sm: 14, md: 18, lg: 22 };

/**
 * Círculo colorido com ícone da categoria — mesmo padrão visual do Mobills.
 * Cor vem de `categoryColor(categoryId)` (paleta `cat-1..12`), ícone de
 * `categoryIconName(name)` (heurística por palavra-chave, sem campo no
 * domínio). `categoryId` null (ex.: "Sem categoria") cai no cinza neutro.
 */
export function CategoryIcon({
  categoryId,
  name,
  size = 'md',
}: {
  categoryId: string | null;
  name: string;
  size?: Size;
}) {
  const box = BOX[size];
  const backgroundColor = categoryId ? categoryColor(categoryId) : '#94a3b8';

  return (
    <View
      style={{ width: box, height: box, borderRadius: box / 2, backgroundColor }}
      className="items-center justify-center"
    >
      <Feather name={categoryIconName(name)} size={ICON[size]} color="#fff" />
    </View>
  );
}
