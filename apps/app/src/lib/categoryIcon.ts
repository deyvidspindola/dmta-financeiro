import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

export type FeatherName = ComponentProps<typeof Feather>['name'];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

// Heurística por palavra-chave no nome da categoria — não existe campo de
// ícone no domínio (Category do apps/api), então o ícone é só visual,
// derivado no client, igual a como a cor já é derivada por id
// (`categoryColor`). Ordem importa: mais específico primeiro.
const KEYWORD_ICONS: readonly [string[], FeatherName][] = [
  [
    ['alimentacao', 'comida', 'mercado', 'supermercado', 'feira', 'padaria', 'acougue'],
    'shopping-cart',
  ],
  [['restaurante', 'lanche', 'bar', 'ifood', 'delivery', 'cafe'], 'coffee'],
  [['aluguel', 'condominio', 'moradia', 'casa', 'iptu'], 'home'],
  [['uber', '99', 'combustivel', 'gasolina', 'onibus', 'transporte', 'estacionamento'], 'truck'],
  [['viagem', 'passeio', 'ferias', 'lazer', 'hotel'], 'umbrella'],
  [['streaming', 'assinatura', 'netflix', 'spotify'], 'refresh-cw'],
  [['farmacia', 'saude', 'medico', 'plano de saude', 'remedio', 'academia'], 'heart'],
  [['escola', 'curso', 'faculdade', 'educacao', 'livro'], 'book-open'],
  [['salario', 'renda', 'pro-labore', 'freelance', 'freela'], 'dollar-sign'],
  [['investimento', 'aplicacao', 'rendimento'], 'trending-up'],
  [['roupa', 'vestuario', 'loja', 'compras'], 'shopping-bag'],
  [['presente', 'doacao'], 'gift'],
  [['telefone', 'celular', 'internet', 'wifi'], 'smartphone'],
  [['energia', 'luz', 'agua', 'gas'], 'zap'],
  [['salao', 'cabelo', 'beleza', 'estetica'], 'scissors'],
  [['imposto', 'taxa', 'tarifa'], 'file'],
  [['seguro'], 'shield'],
  [['transferencia'], 'send'],
];

export function categoryIconName(name: string): FeatherName {
  const normalized = normalize(name);
  for (const [keywords, icon] of KEYWORD_ICONS) {
    if (keywords.some((k) => normalized.includes(k))) return icon;
  }
  return 'tag';
}

/**
 * Conjunto fixo pro seletor manual de ícone (cadastro/edição de
 * categoria) — mistura os ícones que a heurística acima já usa com
 * alguns genéricos a mais, pra cobrir categoria fora do dicionário de
 * palavras-chave.
 */
export const CATEGORY_ICON_CHOICES: readonly FeatherName[] = [
  'shopping-cart',
  'coffee',
  'home',
  'truck',
  'umbrella',
  'refresh-cw',
  'heart',
  'book-open',
  'dollar-sign',
  'trending-up',
  'shopping-bag',
  'gift',
  'smartphone',
  'zap',
  'scissors',
  'file',
  'shield',
  'send',
  'briefcase',
  'tag',
];
