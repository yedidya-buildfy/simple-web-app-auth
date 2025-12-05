import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NavItemType, NavItemDividerType } from '../config';
import { Badge } from '@/components/base/badges/badges';

interface SidebarNavigationSectionDividersProps {
  items: (NavItemType | NavItemDividerType)[];
  activeUrl?: string;
}

export function SidebarNavigationSectionDividers({
  items,
  activeUrl,
}: SidebarNavigationSectionDividersProps) {
  const location = useLocation();
  const currentPath = activeUrl || location.pathname;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    return currentPath === href;
  };

  const isItemOrChildActive = (item: NavItemType) => {
    if (isActive(item.href)) return true;
    if (item.items) {
      return item.items.some((child) => isActive(child.href));
    }
    return false;
  };

  return (
    <nav className="flex flex-col gap-1 w-64 p-3 bg-black border-r border-gray-800">
      {items.map((item, index) => {
        if ('divider' in item) {
          return (
            <div
              key={`divider-${index}`}
              className="my-2 border-t border-gray-800"
            />
          );
        }

        const navItem = item as NavItemType;
        const hasSubItems = navItem.items && navItem.items.length > 0;
        const isExpanded = expandedItems.has(navItem.label);
        const itemActive = isItemOrChildActive(navItem);
        const Icon = navItem.icon;
        const isExternalLink = navItem.href.startsWith('http');

        return (
          <div key={navItem.label}>
            {hasSubItems ? (
              <button
                onClick={() => toggleExpanded(navItem.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  itemActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  <span>{navItem.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            ) : isExternalLink ? (
              <a
                href={navItem.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  itemActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  <span>{navItem.label}</span>
                </div>
                {typeof navItem.badge === 'number' ? (
                  <Badge variant="secondary" size="sm">
                    {navItem.badge}
                  </Badge>
                ) : (
                  navItem.badge
                )}
              </a>
            ) : (
              <Link
                to={navItem.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  itemActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  <span>{navItem.label}</span>
                </div>
                {typeof navItem.badge === 'number' ? (
                  <Badge variant="secondary" size="sm">
                    {navItem.badge}
                  </Badge>
                ) : (
                  navItem.badge
                )}
              </Link>
            )}

            {hasSubItems && isExpanded && (
              <div className="mt-1 ml-8 space-y-1">
                {navItem.items!.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(subItem.href)
                        ? 'bg-green-500/10 text-green-500 font-medium'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <span>{subItem.label}</span>
                    {subItem.badge && (
                      <Badge variant="secondary" size="sm">
                        {subItem.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
