import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';
import type { AccountType } from '@/types/models';

type FeatherName = ComponentProps<typeof Feather>['name'];

const ICON: Record<AccountType, FeatherName> = {
  checking: 'credit-card',
  savings: 'trending-up',
  wallet: 'dollar-sign',
  other: 'folder',
};

const COLOR: Record<AccountType, string> = {
  checking: '#3b82f6',
  savings: '#10b981',
  wallet: '#f59e0b',
  other: '#64748b',
};

export function accountIconName(type: AccountType): FeatherName {
  return ICON[type];
}

export function accountIconColor(type: AccountType): string {
  return COLOR[type];
}
