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
  headerActions
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
            id: 'metrics',
            label: 'Live Summary',
            href: '/admin#metrics',
            icon: LayoutDashboard,
            active: false
          },
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
            },
            {
              id: 'orders',
              label: 'Order Context',
              href: '/#orders',
              icon: LayoutDashboard,
              active: false
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
    <div className="flex flex-col justify-between h-full p-4">
      <div className="flex flex-col gap-4">
        {/* Brand */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#3861FB] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900">RevRescue</span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 tracking-tight">AI Refund Assistant</span>
            </div>
          </Link>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current View Indicator */}
        <div className="mx-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 tracking-tight truncate">{getViewTitle()}</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200/60 flex-shrink-0">
            {activeView}
          </span>
        </div>

        {/* Per-portal navigation */}
        <nav className="flex flex-col gap-1.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`font-semibold rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all text-xs cursor-pointer ${
                  item.active
                    ? 'bg-[#3861FB] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: engine status, view switcher, profile */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-700">AI Review Engine</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">v1.2</span>
        </div>

        {/* Switch View */}
        <div className="relative" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
            aria-expanded={isSwitcherOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[#3861FB]/10 text-[#3861FB] flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold leading-none">Switch View</span>
                <span className="text-xs text-slate-900 font-bold truncate mt-0.5">
                  {viewOptions.find(v => v.id === activeView)?.label || 'Select View'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isSwitcherOpen ? 'rotate-180 text-[#3861FB]' : ''}`} />
          </button>

          {isSwitcherOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select View</span>
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
                      className={`flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                        isCurrent ? 'bg-blue-50 text-[#3861FB]' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${isCurrent ? 'bg-[#3861FB] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {opt.id === 'customer' ? <Sparkles className="w-3.5 h-3.5" /> : opt.id === 'admin' ? <LayoutDashboard className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold leading-tight truncate">{opt.label}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-[#3861FB] flex-shrink-0" />}
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
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-2xs flex-shrink-0">
            <div className="w-full h-full rounded-md bg-white flex items-center justify-center text-[11px] font-bold text-[#3861FB] uppercase">
              {profile.name.slice(0, 2)}
            </div>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold text-slate-900 leading-tight truncate">{profile.name}</span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight truncate">{profile.role}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F3F4F9] text-slate-800 flex antialiased selection:bg-[#3861FB]/20 selection:text-[#3861FB]">

      {/* Sidebar on every portal */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 h-screen z-40 bg-white border-r border-slate-200/80 flex-col overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-white h-full z-10 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex-1 w-full flex flex-col min-h-screen lg:pl-64 xl:pl-72">

        {/* Minimal header: title + contextual actions only */}
        <header className="sticky top-0 z-30 w-full bg-[#F3F4F9]/95 backdrop-blur-md border-b border-slate-200/70 px-5 sm:px-8 py-3.5 flex items-center justify-between transition-shadow">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
              <p className="text-[11px] font-medium text-slate-400 -mt-0.5">{subtitle || todayFormatted}</p>
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2.5">{headerActions}</div>
          )}
        </header>

        <main className="flex-1 w-full px-5 sm:px-8 py-6 flex flex-col gap-6">
          {children}
        </main>
      </div>

    </div>
  );
}

function useCurrentPathname(): string {
  return usePathname() || '/';
}
