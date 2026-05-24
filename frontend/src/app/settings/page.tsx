'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Bell, Shield, Palette, Globe, HelpCircle, LogOut, ChevronRight, Camera, History, Loader2, X,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection = ({ title, children }: SettingSectionProps) => (
  <section className="mb-12">
    <h3 className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] mb-6 px-2">
      {title}
    </h3>
    <div className="bg-cream rounded-[2.5rem] shadow-soft overflow-hidden">
      {children}
    </div>
  </section>
);

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  value?: string;
  isLast?: boolean;
  danger?: boolean;
  onClick?: () => void;
  href?: string;
}

const SettingItem = ({ icon: Icon, label, value, isLast, danger, onClick, href }: SettingItemProps) => {
  const className = cn(
    'w-full flex items-center justify-between p-4 sm:p-6 hover:bg-hemp/20 transition-colors group touch-manipulation min-h-[56px]',
    !isLast && 'border-b border-bark/5'
  );
  const inner = (
    <>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center transition-colors',
            danger
              ? 'bg-red-50 text-red-500'
              : 'bg-hemp/30 text-bark/60 group-hover:bg-sage/10 group-hover:text-sage-deep'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn('font-medium', danger ? 'text-red-500' : 'text-bark')}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm text-bark/40 max-w-[10rem] truncate">{value}</span>}
        <ChevronRight className="h-4 w-4 text-bark/20 group-hover:text-bark/40 transition-colors" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
};

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  useRequireAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Account';

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const openEditName = () => {
    setEditName(displayName);
    setSaveError(null);
    setIsEditOpen(true);
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setSaveError('Display name cannot be empty.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmed, full_name: trimmed },
    });
    if (error) {
      setSaveError(error.message);
    } else {
      setIsEditOpen(false);
    }
    setIsSaving(false);
  };

  if (loading || !user) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-bark/40 font-serif text-xl">
        Loading…
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0">
      <header className="mb-6 sm:mb-10">
        <h1 className="page-title text-2xl sm:text-4xl md:text-5xl text-bark font-serif mb-3 sm:mb-6 leading-tight">
          Settings
        </h1>
      </header>

      <div className="bg-sage text-cream rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 shadow-warm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl overflow-hidden shadow-warm border-4 border-white/20 bg-cream/20 flex items-center justify-center">
              <User className="h-16 w-16 text-cream/80" />
            </div>
            <span className="absolute -bottom-2 -right-2 h-10 w-10 bg-cream rounded-xl shadow-warm flex items-center justify-center text-sage-deep">
              <Camera className="h-5 w-5" />
            </span>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-serif mb-2">{displayName}</h2>
            <p className="text-cream/60 mb-6">{user.email}</p>
            <button
              type="button"
              onClick={openEditName}
              className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-colors touch-manipulation"
            >
              Edit display name
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <SettingSection title="General">
          <SettingItem icon={User} label="Display name" value={displayName} onClick={openEditName} />
          <SettingItem icon={User} label="Account email" value={user.email ?? ''} />
          <SettingItem icon={History} label="Shopping history" href="/history" />
          <SettingItem icon={Bell} label="Notifications" value="Enabled" />
          <SettingItem icon={Shield} label="Privacy & Security" />
          <SettingItem icon={Palette} label="Appearance" value="Serene (Light)" isLast />
        </SettingSection>

        <SettingSection title="Application">
          <SettingItem icon={Globe} label="Language" value="English (US)" />
          <SettingItem icon={HelpCircle} label="Help & Support" />
          <SettingItem icon={Shield} label="Terms of Service" isLast />
        </SettingSection>

        <section className="mt-12 px-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 p-6 bg-red-50 text-red-500 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-xs hover:bg-red-100 transition-colors touch-manipulation min-h-[48px]"
          >
            <LogOut className="h-5 w-5" />
            Sign Out of Account
          </button>
          <p className="text-center text-[10px] text-bark/20 uppercase tracking-[0.4em] mt-8">
            Shopping Memo v0.3.0 • Built with Intention
          </p>
        </section>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-bark/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative w-full max-w-md bg-cream rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-warm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-bark uppercase tracking-[0.2em]">Display name</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-3 bg-hemp/20 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark mb-4 focus:ring-2 focus:ring-sage/20"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
            />
            {saveError && (
              <p className="text-sm text-red-500 mb-4 text-center">{saveError}</p>
            )}
            <button
              type="button"
              onClick={handleSaveName}
              disabled={isSaving}
              className="w-full py-4 bg-sage text-cream rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
