'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Bell, Shield, Palette, Globe, HelpCircle, LogOut, ChevronRight, Camera, History, Loader2, X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { supabase } from '@/lib/supabase';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection = ({ title, children }: SettingSectionProps) => (
  <section className="mb-10 sm:mb-12 animate-fade-in">
    <h3 className="text-[10px] font-bold text-bark/40 uppercase tracking-[0.35em] mb-4 sm:mb-5 px-4">
      {title}
    </h3>
    <div className="bg-cream/40 border border-bark/5 rounded-[2rem] shadow-soft overflow-hidden backdrop-blur-sm">
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
  const router = useRouter();
  const className = cn(
    'w-full flex items-center justify-between p-5 sm:p-6 hover:bg-hemp/15 transition-all duration-300 group touch-manipulation min-h-[58px]',
    !isLast && 'border-b border-bark/5'
  );
  
  const inner = (
    <>
      <div className="flex items-center gap-4 transition-transform duration-300 group-hover:translate-x-1">
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0',
            danger
              ? 'bg-red-50 text-red-500 group-hover:bg-red-100'
              : 'bg-hemp/30 text-bark/60 group-hover:bg-sage/15 group-hover:text-sage-deep'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn('text-sm sm:text-base font-bold transition-colors', danger ? 'text-red-500' : 'text-bark group-hover:text-sage-deep')}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {value && (
          <span className="text-xs sm:text-sm text-bark/40 max-w-[12rem] truncate font-medium bg-hemp/10 py-1 px-3 rounded-lg">
            {value}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-bark/20 group-hover:text-sage-deep/50 group-hover:translate-x-0.5 transition-all duration-300" />
      </div>
    </>
  );

  if (href) {
    return (
      <button 
        type="button" 
        onClick={() => router.push(href)} 
        className={className}
      >
        {inner}
      </button>
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
    'Tài khoản';

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
      setSaveError('Tên hiển thị không được để trống.');
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
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sage" />
          <p className="text-sm text-bark/60 font-medium">Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-page-enter min-w-0 pb-12">
      {/* Page Header */}
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title text-3xl sm:text-4xl md:text-5xl text-bark font-serif leading-tight font-black tracking-tight">
            Cài đặt
          </h1>
          <p className="text-sm text-bark/50 font-medium mt-1">
            Cấu hình tài khoản, tùy chọn ứng dụng và quản lý thông tin cá nhân
          </p>
        </div>
      </header>

      {/* Profile Bento Card */}
      <div className="bg-gradient-to-br from-sage to-sage-deep text-cream rounded-[2.5rem] p-6 sm:p-10 md:p-12 mb-8 sm:mb-12 shadow-warm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-72 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-transform duration-700 group-hover:scale-110" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 text-center md:text-left">
          <div className="relative shrink-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl overflow-hidden shadow-warm border-4 border-white/25 bg-cream/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.03]">
              <User className="h-14 w-14 sm:h-16 sm:w-16 text-cream/90" />
            </div>
            <button
              type="button"
              onClick={openEditName}
              className="absolute -bottom-1 -right-1 h-9 w-9 sm:h-10 sm:w-10 bg-cream hover:bg-white text-sage-deep rounded-xl shadow-warm flex items-center justify-center transition-all hover:scale-105 active:scale-95 duration-200"
              aria-label="Đổi tên hiển thị"
            >
              <Camera className="h-4.5 w-4.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight mb-1 truncate">{displayName}</h2>
            <p className="text-cream/70 text-sm font-medium mb-5 truncate">{user.email}</p>
            <button
              type="button"
              onClick={openEditName}
              className="px-5 py-2 sm:py-2.5 bg-white/15 hover:bg-white/25 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:shadow-sm active:scale-95 duration-200 min-h-[36px]"
            >
              Chỉnh sửa tên hiển thị
            </button>
          </div>
        </div>
      </div>

      {/* Settings Grid / Content */}
      <div className="max-w-4xl mx-auto">
        <SettingSection title="Cá nhân">
          <SettingItem icon={User} label="Tên hiển thị" value={displayName} onClick={openEditName} />
          <SettingItem icon={User} label="Email tài khoản" value={user.email ?? ''} />
          <SettingItem icon={History} label="Lịch sử mua sắm" href="/history" />
          <SettingItem icon={Bell} label="Thông báo" value="Đã bật" />
          <SettingItem icon={Shield} label="Quyền riêng tư & Bảo mật" />
          <SettingItem icon={Palette} label="Giao diện" value="Tĩnh lặng (Sáng)" isLast />
        </SettingSection>

        <SettingSection title="Ứng dụng">
          <SettingItem icon={Globe} label="Ngôn ngữ" value="Tiếng Việt" />
          <SettingItem icon={HelpCircle} label="Trợ giúp & Hỗ trợ" />
          <SettingItem icon={Shield} label="Điều khoản dịch vụ" isLast />
        </SettingSection>

        <section className="mt-12 px-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 p-5.5 sm:p-6 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl font-extrabold uppercase tracking-[0.2em] text-xs transition-all duration-300 active:scale-[0.99] shadow-soft hover:shadow min-h-[54px]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Đăng xuất tài khoản
          </button>
          <p className="text-center text-[10px] text-bark/20 font-black uppercase tracking-[0.35em] mt-10">
            Shopping Memo v0.3.0 • Được thiết kế tỉ mỉ
          </p>
        </section>
      </div>

      {/* Edit Display Name Glassmorphic Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bark/30 backdrop-blur-sm transition-opacity duration-300"
            aria-label="Đóng"
            onClick={() => !isSaving && setIsEditOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-cream/95 backdrop-blur-lg border border-bark/8 rounded-t-[2.5rem] sm:rounded-3xl p-6 sm:p-8 shadow-warm animate-scale-in pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-8">
            <div className="flex items-center justify-between mb-6 gap-2 border-b border-bark/5 pb-3">
              <div className="min-w-0">
                <span className="text-[9px] font-black text-gold/80 tracking-widest uppercase">
                  Tài khoản
                </span>
                <h3 className="text-xs font-extrabold text-bark/40 uppercase tracking-[0.15em] truncate mt-0.5">
                  Đổi tên hiển thị
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
                className="p-2.5 bg-hemp/20 hover:bg-hemp/30 text-bark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-bark/40 px-1">
                  Tên hiển thị mới
                </label>
                <input
                  type="text"
                  className="w-full bg-hemp/10 border-0 rounded-2xl py-4 px-6 text-bark font-serif text-lg font-bold placeholder:text-bark/25 focus:ring-2 focus:ring-sage/20 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(51,69,55,0.01)]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  placeholder="Nhập tên hiển thị..."
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">{saveError}</p>
              )}
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving || !editName.trim()}
                className="w-full py-4 bg-sage text-cream rounded-2xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation min-h-[48px] shadow-warm hover:bg-sage-deep transition-all duration-300 hover:shadow active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
