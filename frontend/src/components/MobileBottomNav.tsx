'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, UtensilsCrossed, Package, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/', label: 'Plan', icon: CalendarDays },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/products', label: 'Items', icon: Package },
  { href: '/shopping', label: 'Shop', icon: ShoppingCart },
  { href: '/settings', label: 'You', icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/reset-password') return null;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-bark/10 bg-cream/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1 max-w-[5.5rem]">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] rounded-xl transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-sage/30 focus:bg-sage/5',
                  isActive ? 'text-sage-deep bg-sage/5' : 'text-bark/45 hover:bg-hemp/50 active:bg-hemp/50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5 shrink-0 transition-all', isActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
