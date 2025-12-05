import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { NavItemType } from '../config';
import { Badge } from '@/components/base/badges/badges';

interface SidebarNavigationSlimProps {
  items: NavItemType[];
  footerItems?: NavItemType[];
}

export function SidebarNavigationSlim({
  items,
  footerItems = [],
}: SidebarNavigationSlimProps) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const isItemOrChildActive = (item: NavItemType) => {
    if (isActive(item.href)) return true;
    if (item.items) {
      return item.items.some((child) => isActive(child.href));
    }
    return false;
  };

  const renderNavItem = (navItem: NavItemType, isFooter = false) => {
    const hasSubItems = navItem.items && navItem.items.length > 0;
    const itemActive = isItemOrChildActive(navItem);
    const Icon = navItem.icon;
    const isExternalLink = navItem.href.startsWith('http');
    const isItemHovered = hoveredItem === navItem.label;

    const itemContent = (
      <>
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0 w-0'}`}>
            {navItem.label}
          </span>
        </div>
        {isHovered && (
          <>
            {typeof navItem.badge === 'number' ? (
              <Badge variant="secondary" size="sm">
                {navItem.badge}
              </Badge>
            ) : (
              navItem.badge
            )}
            {hasSubItems && <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />}
          </>
        )}
      </>
    );

    const className = `relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      itemActive
        ? 'bg-green-500/10 text-green-500'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`;

    return (
      <div
        key={navItem.label}
        className="relative"
        onMouseEnter={() => setHoveredItem(navItem.label)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {isExternalLink ? (
          <a
            href={navItem.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {itemContent}
          </a>
        ) : (
          <Link to={navItem.href} className={className}>
            {itemContent}
          </Link>
        )}

        {/* Popup menu for sub-items */}
        {hasSubItems && isItemHovered && (
          <div className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 z-50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
              {navItem.label}
            </div>
            <div className="space-y-1">
              {navItem.items!.map((subItem) => {
                const SubIcon = subItem.icon;
                const subItemActive = isActive(subItem.href);

                return (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      subItemActive
                        ? 'bg-green-500/10 text-green-500 font-medium'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                      <span>{subItem.label}</span>
                    </div>
                    {subItem.badge && (
                      <Badge variant="secondary" size="sm">
                        {subItem.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav
      className={`flex flex-col justify-between h-screen bg-black border-r border-gray-800 transition-all duration-200 ${
        isHovered ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredItem(null);
      }}
    >
      <div className="flex flex-col gap-1 p-3 overflow-hidden">
        {items.map((item) => renderNavItem(item))}
      </div>

      {footerItems.length > 0 && (
        <div className="flex flex-col gap-1 p-3 border-t border-gray-800 overflow-hidden">
          {footerItems.map((item) => renderNavItem(item, true))}
        </div>
      )}
    </nav>
  );
}
