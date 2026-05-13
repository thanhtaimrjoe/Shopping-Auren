'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, User, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-6 top-6 bottom-6 w-[280px] bg-cream rounded-3xl z-20 shadow-soft flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-4 p-8 pt-10">
        <div className="h-12 w-12 rounded-full overflow-hidden shrink-0">
           <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-xl text-bark font-serif tracking-wide">
          Shopping Memo
        </h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 space-y-2">
        <Link 
          href="/" 
          className={twMerge(
            clsx(
              "group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
              pathname === '/' 
                ? "bg-hemp text-bark shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]" 
                : "text-bark/60 hover:bg-hemp/50 hover:text-bark"
            )
          )}
        >
          <CalendarDays className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Weekly Plan</span>
        </Link>
        
        <Link 
          href="/shopping" 
          className={twMerge(
            clsx(
              "group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
              pathname === '/shopping' 
                ? "bg-hemp text-bark shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]" 
                : "text-bark/60 hover:bg-hemp/50 hover:text-bark"
            )
          )}
        >
          <ShoppingCart className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Shopping List</span>
        </Link>
        
        <Link 
          href="/settings" 
          className={twMerge(
            clsx(
              "group flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
              pathname === '/settings' 
                ? "bg-hemp text-bark shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]" 
                : "text-bark/60 hover:bg-hemp/50 hover:text-bark"
            )
          )}
        >
          <User className="h-5 w-5 shrink-0" strokeWidth={1.5} />
          <span className="font-medium tracking-wide">Settings</span>
        </Link>
      </nav>
    </aside>
  );
}
