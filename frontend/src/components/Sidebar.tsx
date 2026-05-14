'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, User, ShoppingCart, Menu, X, UtensilsCrossed } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { href: '/', label: 'Weekly Plan', icon: CalendarDays },
    { href: '/meals', label: 'Meals Library', icon: UtensilsCrossed },
    { href: '/shopping', label: 'Shopping List', icon: ShoppingCart },
    { href: '/settings', label: 'Settings', icon: User },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-cream/80 backdrop-blur-md border-b border-bark/10 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg overflow-hidden shadow-soft">
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-serif font-semibold text-bark">Shopping Memo</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-bark/5 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-bark" />
        </button>
      </header>

      {/* Mobile Bottom-up Modal (Drawer) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-cream rounded-t-[2.5rem] shadow-warm p-6 animate-in slide-in-from-bottom duration-500 ease-out max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl text-bark font-serif">Menu</h2>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-bark/5 transition-colors"
              >
                <X className="h-6 w-6 text-bark/40" />
              </button>
            </div>

            <nav className="space-y-2 mb-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all active:scale-[0.98]",
                      isActive 
                        ? "bg-sage/10 text-sage-deep font-bold" 
                        : "text-bark/60 hover:bg-bark/5"
                    )}
                  >
                    <Icon className={cn("h-6 w-6", isActive ? "text-sage-deep" : "text-bark/40")} />
                    <span className="text-base tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 bg-hemp/20 rounded-2xl flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-sage/20 flex items-center justify-center text-sage-deep font-bold">
                TM
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-bark">Tai HT</p>
                <p className="text-xs text-bark/40">Premium Plan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] bg-cream border-r border-bark/10 z-30 flex-col translate-x-0 transition-all duration-300"
      )}>
        {/* Brand Section */}
        <div className="flex items-center gap-3 p-6 lg:p-8 border-b border-bark/5">
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-soft">
             <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg text-bark font-serif font-semibold tracking-tight">
            Shopping Memo
          </h1>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={cn(
                  "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-sage/10 text-sage-deep" 
                    : "text-bark/50 hover:bg-hemp/40 hover:text-bark"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sage rounded-r-full" />
                )}
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-sage-deep" : "text-bark/40 group-hover:text-bark"
                )} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile Brief */}
        <div className="p-4 border-t border-bark/5 bg-hemp/5">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-hemp/20 transition-colors cursor-pointer group">
            <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-sage-deep font-bold text-xs">
              TM
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-bark truncate">Tai HT</p>
              <p className="text-[10px] text-bark/40 truncate">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
