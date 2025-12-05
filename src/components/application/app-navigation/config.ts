import { ReactNode } from 'react';

export interface NavItemType {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: ReactNode | number;
  items?: {
    label: string;
    href: string;
    badge?: number;
  }[];
}

export interface NavItemDividerType {
  divider: true;
}
