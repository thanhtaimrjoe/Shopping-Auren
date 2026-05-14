'use client';

import { User, Bell, Shield, Palette, Globe, HelpCircle, LogOut, ChevronRight, Camera } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

const SettingItem = ({ icon: Icon, label, value, isLast, danger }: SettingItemProps) => (
  <button className={cn(
    "w-full flex items-center justify-between p-6 hover:bg-hemp/20 transition-colors group",
    !isLast && "border-b border-bark/5"
  )}>
    <div className="flex items-center gap-4">
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
        danger ? "bg-red-50 text-red-500" : "bg-hemp/30 text-bark/60 group-hover:bg-sage/10 group-hover:text-sage-deep"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn("font-medium", danger ? "text-red-500" : "text-bark")}>{label}</span>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-sm text-bark/40">{value}</span>}
      <ChevronRight className="h-4 w-4 text-bark/20 group-hover:text-bark/40 transition-colors" />
    </div>
  </button>
);

export default function SettingsPage() {
  return (
    <div className="pb-24 animate-page-enter">
      {/* Editorial Header */}
      <header className="mb-12">
        <span className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.4em] block pt-8 mb-4">
          Preferences
        </span>
        <h1 className="text-4xl md:text-5xl text-bark font-serif mb-6 leading-tight">
          Settings
        </h1>
        <p className="text-xl text-bark/60 max-w-2xl leading-relaxed">
          Tailor your culinary planning experience to your personal rhythm.
        </p>
      </header>

      {/* Profile Summary Card */}
      <div className="bg-sage text-cream rounded-[3rem] p-8 md:p-12 mb-12 shadow-warm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="h-32 w-32 rounded-3xl overflow-hidden shadow-warm border-4 border-white/20">
              <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-cream rounded-xl shadow-warm flex items-center justify-center text-sage-deep hover:scale-110 transition-transform">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-serif mb-2">Tai HT</h2>
            <p className="text-cream/60 mb-6">taiht@example.com</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Premium Plan</span>
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Active since 2024</span>
            </div>
          </div>
          <button className="px-8 py-4 bg-cream text-sage-deep rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft hover:bg-white transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <SettingSection title="General">
          <SettingItem icon={User} label="Account Information" value="Personal" />
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
          <button className="w-full flex items-center justify-center gap-3 p-6 bg-red-50 text-red-500 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-xs hover:bg-red-100 transition-colors">
            <LogOut className="h-5 w-5" />
            Sign Out of Account
          </button>
          <p className="text-center text-[10px] text-bark/20 uppercase tracking-[0.4em] mt-8">
            Shopping Memo v0.1.0 • Built with Intention
          </p>
        </section>
      </div>
    </div>
  );
}
