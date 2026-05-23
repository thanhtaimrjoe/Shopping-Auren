'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  User as UserIcon,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (pathname === '/login' || pathname === '/reset-password') return null;

  const navItems = [
    { href: '/', label: 'Weekly Plan', icon: CalendarDays },
    { href: '/meals', label: 'Meals Library', icon: UtensilsCrossed },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/shopping', label: 'Shopping List', icon: ShoppingCart },
    { href: '/settings', label: 'Settings', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile: compact top bar (nav is in MobileBottomNav) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-cream/90 backdrop-blur-md border-b border-bark/10 px-4 pt-[env(safe-area-inset-top)]">
        <div className="h-14 flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-lg overflow-hidden shadow-soft shrink-0">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-serif font-semibold text-bark truncate">Shopping Memo</p>
            {user?.email && (
              <p className="text-[10px] text-bark/45 truncate">{user.email}</p>
            )}
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] bg-cream border-r border-bark/10 z-30 flex-col">
        <div className="flex items-center gap-3 p-6 lg:p-8 border-b border-bark/5">
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-soft">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-lg text-bark font-serif font-semibold tracking-tight">Shopping Memo</h1>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive ? 'bg-sage/10 text-sage-deep' : 'text-bark/50 hover:bg-hemp/40 hover:text-bark'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sage rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-colors',
                    isActive ? 'text-sage-deep' : 'text-bark/40 group-hover:text-bark'
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-bark/5 bg-hemp/5">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-hemp/20 transition-colors group">
            <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-sage-deep font-bold text-xs shrink-0">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-bark truncate">{user?.email}</p>
              <p className="text-[10px] text-bark/40 truncate">Account</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 touch-manipulation"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
