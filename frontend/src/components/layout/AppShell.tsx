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
  userProfile?: {
    name: string;
    role: string;
  };
  headerActions?: React.ReactNode;
  hideSidebar?: boolean;
}

export function AppShell({
  children,
  activeView,
  title,
  subtitle,
  userProfile,
  headerActions,
  hideSidebar
}: AppShellProps) {
  const pathname = useCurrentPathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isHeaderSwitcherOpen, setIsHeaderSwitcherOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const headerSwitcherRef = useRef<HTMLDivElement>(null);

  const hasSidebar = hideSidebar !== undefined ? !hideSidebar : activeView === 'admin';

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
      if (headerSwitcherRef.current && !headerSwitcherRef.current.contains(event.target as Node)) {
        setIsHeaderSwitcherOpen(false);
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

  const navItems =
    activeView === 'admin'
      ? [
          {
            id: 'queue',
            label: 'Refund Requests',
            href: '/admin',
            icon: LayoutDashboard,
            active: pathname === '/admin'
          }
        ]
      : activeView === 'policy'
        ? [
            {
              id: 'overview',
              label: 'Refund Policy Rules',
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

  const defaultUser = {
    name: activeView === 'admin' ? 'Ferra Alexandra' : 'Sarah Jenkins',
    role: activeView === 'admin' ? 'Support Supervisor' : 'Verified Customer'
  };

  const profile = userProfile || defaultUser;

  const getViewTitle = () => {
    switch (activeView) {
      case 'admin': return 'Support Dashboard';
      case 'policy': return 'Refund Policy';
      default: return 'Customer Support';
    }
  };

  const switcherContent = (
    open: boolean,
    setOpen: (v: boolean) => void,
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'up' | 'down' = 'up'
  ) => (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
        aria-expanded={open}
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
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180 text-[#3861FB]' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
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
                    setOpen(false);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                    isCurrent
                      ? 'bg-blue-50 text-[#3861FB]'
                      : 'hover:bg-slate-50 text-slate-700'
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
  );

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

      <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
        {/* Engine Status */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-semibold text-slate-700">AI Review Engine</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">v1.2</span>
        </div>

        {switcherContent(isSwitcherOpen, setIsSwitcherOpen, switcherRef)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F3F4F9] text-slate-800 flex antialiased selection:bg-[#3861FB]/20 selection:text-[#3861FB]">

      {hasSidebar && (
        <>
          <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 h-screen z-40 bg-white border-r border-slate-200/80 flex-col overflow-y-auto">
            {sidebarContent}
          </aside>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="relative w-72 bg-white h-full z-10 shadow-2xl flex flex-col">
                {sidebarContent}
              </div>
            </div>
          )}
        </>
      )}

      <div className={`flex-1 w-full flex flex-col min-h-screen ${hasSidebar ? 'lg:pl-64 xl:pl-72' : ''}`}>

        <header className="sticky top-0 z-30 w-full bg-[#F3F4F9]/95 backdrop-blur-md border-b border-slate-200/70 px-5 sm:px-8 py-3.5 flex items-center justify-between transition-shadow">
          <div className="flex items-center gap-4">
            {!hasSidebar ? (
              <>
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#3861FB] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight text-slate-900 leading-tight">RevRescue</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-tight">AI Refund Assistant</span>
                  </div>
                </Link>

                <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-xs font-bold text-slate-800">{getViewTitle()}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {headerActions}

            {!hasSidebar && (
              <div className="hidden md:block w-56">
                {switcherContent(isHeaderSwitcherOpen, setIsHeaderSwitcherOpen, headerSwitcherRef, 'down')}
              </div>
            )}

            {/* Profile */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200/80 ml-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-2xs flex-shrink-0">
                <div className="w-full h-full rounded-md bg-white flex items-center justify-center text-[11px] font-bold text-[#3861FB] uppercase">
                  {profile.name.slice(0, 2)}
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">{profile.name}</span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">{profile.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-5 sm:px-8 py-6 flex flex-col gap-6">
          {!hasSidebar && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{subtitle || todayFormatted}</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

    </div>
  );
}

function useCurrentPathname(): string {
  return usePathname() || '/';
}
