'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, User, ShoppingCart } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-20 lg:w-[260px] bg-cream border-r border-bark/10 z-[45] flex flex-col translate-x-0 transition-all duration-300"
      )}>
        {/* Brand Section */}
        <div className="flex items-center gap-3 p-5 lg:p-8 border-b border-bark/5 justify-center lg:justify-start">
          <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 shadow-soft">
             <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg text-bark font-serif font-semibold tracking-tight hidden lg:block">
            Shopping Memo
          </h1>
        </div>
        
        {/* Navigation List */}
        <nav className="flex-1 px-2 lg:px-4 py-8 space-y-1">
          <Link 
            href="/" 
            className={cn(
              "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 justify-center lg:justify-start",
              pathname === '/' 
                ? "bg-sage/10 text-sage-deep" 
                : "text-bark/50 hover:bg-hemp/40 hover:text-bark"
            )}
          >
            {pathname === '/' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sage rounded-r-full" />
            )}
            <CalendarDays className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              pathname === '/' ? "text-sage-deep" : "text-bark/40 group-hover:text-bark"
            )} strokeWidth={pathname === '/' ? 2 : 1.5} />
            <span className="font-medium text-sm tracking-wide hidden lg:block">Weekly Plan</span>
          </Link>
          
          <Link 
            href="/shopping" 
            className={cn(
              "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 justify-center lg:justify-start",
              pathname === '/shopping' 
                ? "bg-sage/10 text-sage-deep" 
                : "text-bark/50 hover:bg-hemp/40 hover:text-bark"
            )}
          >
            {pathname === '/shopping' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sage rounded-r-full" />
            )}
            <ShoppingCart className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              pathname === '/shopping' ? "text-sage-deep" : "text-bark/40 group-hover:text-bark"
            )} strokeWidth={pathname === '/shopping' ? 2 : 1.5} />
            <span className="font-medium text-sm tracking-wide hidden lg:block">Shopping List</span>
          </Link>
          
          <Link 
            href="/settings" 
            className={cn(
              "group relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 justify-center lg:justify-start",
              pathname === '/settings' 
                ? "bg-sage/10 text-sage-deep" 
                : "text-bark/50 hover:bg-hemp/40 hover:text-bark"
            )}
          >
            {pathname === '/settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sage rounded-r-full" />
            )}
            <User className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              pathname === '/settings' ? "text-sage-deep" : "text-bark/40 group-hover:text-bark"
            )} strokeWidth={pathname === '/settings' ? 2 : 1.5} />
            <span className="font-medium text-sm tracking-wide hidden lg:block">Settings</span>
          </Link>
        </nav>

        {/* Footer / User Profile Brief */}
        <div className="p-4 border-t border-bark/5 bg-hemp/5">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-hemp/20 transition-colors cursor-pointer group justify-center lg:justify-start">
            <div className="h-8 w-8 rounded-full bg-sage/20 flex items-center justify-center text-sage-deep font-bold text-xs">
              TM
            </div>
            <div className="flex-1 overflow-hidden hidden lg:block">
              <p className="text-xs font-bold text-bark truncate">Tai HT</p>
              <p className="text-[10px] text-bark/40 truncate">Premium Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
