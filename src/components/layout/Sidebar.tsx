"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ArrowUpTrayIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { signOut } from "@/app/(auth)/actions";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

const navigation: (NavItem | NavGroup)[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Uploads",
    icon: ArrowUpTrayIcon,
    children: [
      { name: "Bank Transactions", href: "/uploads/bank", icon: BuildingLibraryIcon },
      { name: "Credit Card", href: "/uploads/credit-card", icon: CreditCardIcon },
      { name: "Invoices & Receipts", href: "/uploads/invoices", icon: DocumentTextIcon },
    ],
  },
  { name: "Matching", href: "/matching", icon: ArrowsRightLeftIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item;
}

export function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["Uploads"]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const isGroupActive = (group: NavGroup) => {
    return group.children.some((child) => pathname === child.href);
  };

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`
        fixed left-0 top-0 h-full
        bg-background-secondary border-r border-border
        transition-all duration-300 ease-in-out
        flex flex-col
        z-50
        ${isExpanded ? "w-64" : "w-16"}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <span
          className={`text-green font-bold transition-all duration-300 ${
            isExpanded ? "text-xl" : "text-lg"
          }`}
        >
          {isExpanded ? "InvoiceMatch" : "IM"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            if (isNavGroup(item)) {
              const isOpen = openGroups.includes(item.name);
              const isActive = isGroupActive(item);

              return (
                <li key={item.name}>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
                      transition-all duration-200
                      ${
                        isActive
                          ? "text-green"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-hover"
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`
                        flex-1 text-left whitespace-nowrap overflow-hidden transition-all duration-300
                        ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
                      `}
                    >
                      {item.name}
                    </span>
                    <ChevronDownIcon
                      className={`
                        w-4 h-4 transition-transform duration-200
                        ${isOpen ? "rotate-180" : ""}
                        ${isExpanded ? "opacity-100" : "opacity-0"}
                      `}
                    />
                  </button>

                  {/* Sub-menu */}
                  {isExpanded && isOpen && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg
                                transition-all duration-200 text-sm
                                ${
                                  isChildActive
                                    ? "bg-green/10 text-green"
                                    : "text-foreground-muted hover:text-foreground hover:bg-background-hover"
                                }
                              `}
                            >
                              <child.icon className="w-4 h-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">{child.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-green/10 text-green"
                        : "text-foreground-muted hover:text-foreground hover:bg-background-hover"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span
                    className={`
                      whitespace-nowrap overflow-hidden transition-all duration-300
                      ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
                    `}
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => signOut()}
          className="
            flex items-center gap-3 px-3 py-2.5 rounded-lg w-full
            text-foreground-muted hover:text-error hover:bg-error/10
            transition-all duration-200
          "
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          <span
            className={`
              whitespace-nowrap overflow-hidden transition-all duration-300
              ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"}
            `}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
