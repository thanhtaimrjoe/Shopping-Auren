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
      {/* Mobile: compact premium top bar with subtle backdrop blur & shadow depth */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-cream/90 backdrop-blur-lg border-b border-bark/8 px-4 pt-[env(safe-area-inset-top)] shadow-[0_4px_20px_-4px_rgba(51,69,55,0.05)]">
        <div className="h-14 flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl overflow-hidden shadow-soft shrink-0 ring-2 ring-gold/20 flex-shrink-0 active:scale-95 transition-transform duration-200">
            <img
              src="/icons/icon-192x192.png"
              alt="Shopping Memo logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-serif font-bold text-bark tracking-tight">Shopping Memo</p>
            {user?.email && (
              <p className="text-[10px] text-bark/40 font-medium truncate" title={user.email}>{user.email}</p>
            )}
          </div>
        </div>
      </header>

      {/* Desktop premium sidebar with gentle depth and modern aesthetics */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[265px] bg-cream/95 backdrop-blur-md border-r border-bark/8 z-30 flex-col shadow-[4px_0_24px_rgba(51,69,55,0.02)]">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 p-6 lg:p-8 border-b border-bark/5 group/brand">
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-soft ring-2 ring-gold/25 flex-shrink-0 group-hover/brand:scale-105 group-hover/brand:rotate-3 transition-all duration-500 ease-out">
            <img
              src="/icons/icon-192x192.png"
              alt="Shopping Memo logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg text-bark font-serif font-bold tracking-tight">Shopping Memo</h1>
            <p className="text-[9px] font-extrabold text-gold/80 tracking-widest uppercase font-sans mt-0.5">
              Kitchen & Lifestyle
            </p>
          </div>
        </div>

        {/* Navigation Section with micro-interactions */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-sage/20 focus:bg-sage/5',
                  isActive
                    ? 'bg-gradient-to-r from-olive/12 via-olive/5 to-transparent text-sage-deep shadow-[sm_inset_1px_0_0_rgba(51,69,55,0.05)] font-semibold'
                    : 'text-bark/50 hover:bg-hemp/40 hover:text-bark hover:translate-x-1.5'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-gold rounded-r-full animate-scale-y" />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-300',
                    isActive 
                      ? 'text-sage-deep scale-105' 
                      : 'text-bark/35 group-hover:text-bark group-hover:scale-105'
                  )}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span className="text-[13.5px] tracking-wide transition-colors">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account Bento Card */}
        <div className="p-4 border-t border-bark/5 bg-hemp/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream/40 border border-bark/5 hover:border-bark/10 hover:bg-cream/80 transition-all duration-300 group/profile shadow-[0_2px_12px_rgba(51,69,55,0.02)]">
            <div className="h-9 w-9 rounded-xl bg-sage text-cream flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ring-2 ring-cream/80">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-bark truncate leading-none mb-0.5" title={user?.email || 'User'}>
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-[9px] font-semibold text-bark/40 uppercase tracking-wider">Account</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 hover:bg-error-container/30 hover:text-error text-bark/40 hover:opacity-100 group-hover/profile:opacity-75 transition-all duration-200 rounded-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-300/20 min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4.5 w-4.5 transition-transform group-hover/profile:translate-x-0.5 duration-300" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

