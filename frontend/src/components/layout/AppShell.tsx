'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  ChevronDown,
  Check,
  ArrowRightLeft,
  X,
  Menu
} from 'lucide-react';

export type AppViewRole = 'customer' | 'admin' | 'policy';

interface AppShellProps {
  children: React.ReactNode;
  activeView: AppViewRole;
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  noPageScroll?: boolean;
}

/**
 * Consistent application shell: every portal (customer, admin, policy) uses the
 * same left sidebar for identity, navigation, view switching and profile.
 * The top header is intentionally minimal: page title + contextual actions.
 */
export function AppShell({
  children,
  activeView,
  title,
  subtitle,
  headerActions,
  noPageScroll = false
}: AppShellProps) {
  const pathname = useCurrentPathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close the switcher on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const viewOptions = [
    {
      id: 'customer' as const,
      label: 'Customer Portal',
      description: 'Pick an order and chat with the AI refund assistant',
      href: '/'
    },
    {
      id: 'admin' as const,
      label: 'Support Dashboard',
      description: 'Review decisions, AI reasoning and manual overrides',
      href: '/admin'
    },
    {
      id: 'policy' as const,
      label: 'Refund Policy Rules',
      description: 'The business rules the AI must follow',
      href: '/policy'
    }
  ];

  // Per-portal navigation: first item is the portal home, extras jump to
  // on-page sections so the sidebar is genuinely useful within each portal.
  const navItems =
    activeView === 'admin'
      ? [
          {
            id: 'queue',
            label: 'Refund Requests',
            href: '/admin',
            icon: FileText,
            active: pathname === '/admin'
          }
        ]
      : activeView === 'policy'
        ? [
            {
              id: 'overview',
              label: 'All Policy Rules',
              href: '/policy',
              icon: FileText,
              active: pathname === '/policy'
            }
          ]
        : [
            {
              id: 'refund',
              label: 'Refund Assistant',
              href: '/',
              icon: Sparkles,
              active: pathname === '/'
            }
          ];

  const profile = {
    name: activeView === 'admin' ? 'Ferra Alexandra' : 'Sarah Jenkins',
    role: activeView === 'admin' ? 'Support Supervisor' : 'Verified Customer'
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'admin': return 'Support Dashboard';
      case 'policy': return 'Refund Policy';
      default: return 'Customer Support';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4.5">
      <div className="flex flex-col gap-5">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#6D28D9] via-[#7C3AED] to-[#8B5CF6] flex items-center justify-center shadow-[0_4px_16px_rgba(124,58,237,0.3)] group-hover:scale-105 transition-all duration-300">
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white/90 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                RefundRescue
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]"></span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold -mt-0.5 tracking-tight">AI Refund Assistant</span>
            </div>
          </Link>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current View Indicator */}
        <div className="mx-1 px-3.5 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-2xs flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 tracking-tight truncate">{getViewTitle()}</span>
          <span className="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex-shrink-0">
            {activeView}
          </span>
        </div>

        {/* Per-portal navigation */}
        <nav className="flex flex-col gap-1.5 mt-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-semibold rounded-2xl px-4 py-3 flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  item.active
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-[0_4px_16px_rgba(124,58,237,0.25)] font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-medium'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-xs tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: engine status, view switcher, profile */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-200/60">
        <div className="px-3.5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.5)]"></span>
            <span className="text-[11px] font-bold text-slate-700">AI Review Engine</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100/80">v1.2</span>
        </div>

        {/* Switch View */}
        <div className="relative" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/80 hover:bg-white border border-white/90 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            aria-expanded={isSwitcherOpen}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6.5 h-6.5 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-black leading-none">Switch View</span>
                <span className="text-xs text-slate-900 font-bold truncate mt-0.5">
                  {viewOptions.find(v => v.id === activeView)?.label || 'Select View'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isSwitcherOpen ? 'rotate-180 text-[#7C3AED]' : ''}`} />
          </button>

          {isSwitcherOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/90 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select View</span>
              </div>

              <div className="flex flex-col gap-0.5 mt-1">
                {viewOptions.map((opt) => {
                  const isCurrent = activeView === opt.id;
                  return (
                    <Link
                      key={opt.id}
                      href={opt.href}
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                        isCurrent ? 'bg-[#F5F3FF] text-[#7C3AED]' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${isCurrent ? 'bg-[#7C3AED] text-white shadow-2xs' : 'bg-slate-100 text-slate-500'}`}>
                        {opt.id === 'customer' ? <Sparkles className="w-3.5 h-3.5" /> : opt.id === 'admin' ? <LayoutDashboard className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold leading-tight truncate">{opt.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#7C3AED] flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">{opt.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] p-0.5 shadow-2xs flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center text-[11px] font-black text-[#7C3AED] uppercase">
              {profile.name.slice(0, 2)}
            </div>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate">{profile.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold leading-tight truncate">{profile.role}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] flex antialiased selection:bg-[#7C3AED]/20 selection:text-[#7C3AED]">

      {/* Sidebar on every portal */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 h-screen z-40 bg-white/70 backdrop-blur-xl border-r border-white/80 flex-col overflow-y-auto shadow-[4px_0_24px_rgba(15,23,42,0.02)]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-white/90 backdrop-blur-2xl h-full z-10 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className={`flex-1 w-full flex flex-col ${noPageScroll ? 'lg:h-screen lg:overflow-hidden' : 'min-h-screen'} lg:pl-64 xl:pl-72`}>

        {/* Minimal header: title + contextual actions only */}
        <header className="flex-shrink-0 z-30 w-full bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-white/80 px-6 sm:px-9 py-3.5 flex items-center justify-between transition-all shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/80 border border-white/90 text-slate-600 hover:text-slate-900 shadow-2xs"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">{title}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle || todayFormatted}</p>
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2.5">{headerActions}</div>
          )}
        </header>

        <main className={`flex-1 w-full px-6 sm:px-9 ${noPageScroll ? 'py-3.5 overflow-hidden flex flex-col gap-3 min-h-0' : 'py-7 flex flex-col gap-6'}`}>
          {children}
        </main>
      </div>

    </div>
  );
}

function useCurrentPathname(): string {
  return usePathname() || '/';
}
