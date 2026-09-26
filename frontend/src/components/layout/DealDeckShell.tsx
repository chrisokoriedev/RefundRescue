'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  CreditCard,
  Receipt,
  Settings,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  Check,
  Search,
  Bell,
  Sparkles,
  Store,
  UserCheck,
  BarChart3,
  ShieldAlert,
  ArrowRightLeft,
  X
} from 'lucide-react';

export type PortalViewRole = 'customer' | 'merchant' | 'admin' | 'policy';

interface DealDeckShellProps {
  children: React.ReactNode;
  activeView: PortalViewRole;
  title: string;
  subtitle?: string;
  userProfile?: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  headerActions?: React.ReactNode;
}

export function DealDeckShell({
  children,
  activeView,
  title,
  subtitle,
  userProfile,
  headerActions
}: DealDeckShellProps) {
  const pathname = usePathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close switcher on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format current date matching DealDeck ("Friday, December 15th 2023" style)
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const viewOptions = [
    {
      id: 'customer',
      label: 'Customer Portal',
      description: 'Order selection & AI refund chat deliberation',
      href: '/',
      icon: UserCheck,
      badge: 'Client End-User'
    },
    {
      id: 'merchant',
      label: 'Merchant / Client View',
      description: 'Store return financials, high-risk items & revenue',
      href: '/merchant',
      icon: Store,
      badge: 'Store Client'
    },
    {
      id: 'admin',
      label: 'Admin & Fraud Operations',
      description: 'Deliberation traces, ticket queue & supervisor overrides',
      href: '/admin',
      icon: LayoutDashboard,
      badge: 'Supervisor Admin'
    },
    {
      id: 'policy',
      label: 'Policy Engine Specifications',
      description: 'Active deterministic gates and Gemini deliberation rules',
      href: '/policy',
      icon: FileText,
      badge: 'Rules Engine'
    }
  ];

  // Dynamic Navigation menu items based on current portal view
  const getNavSections = () => {
    if (activeView === 'admin') {
      return [
        {
          heading: 'MENU',
          items: [
            { label: 'Overview', href: '/admin', icon: LayoutDashboard, active: pathname === '/admin' },
            { label: 'Deliberation Report', href: '/admin#reports', icon: BarChart3, active: false },
            { label: 'Ticket Queue', href: '/admin#tickets', icon: Package, active: false },
            { label: 'Synthetic Personas', href: '/', icon: Users, active: false }
          ]
        },
        {
          heading: 'OPERATIONS',
          items: [
            { label: 'Policy Engine', href: '/policy', icon: FileText, active: pathname === '/policy' },
            { label: 'Guardrail Defense', href: '/admin', icon: ShieldAlert, active: false }
          ]
        },
        {
          heading: 'TOOLS',
          items: [
            { label: 'Settings', href: '#', icon: Settings, active: false },
            { label: 'Audit Trail', href: '#', icon: Receipt, active: false },
            { label: 'Help & Docs', href: 'https://github.com', icon: HelpCircle, active: false }
          ]
        }
      ];
    } else if (activeView === 'merchant') {
      return [
        {
          heading: 'MENU',
          items: [
            { label: 'Dashboard', href: '/merchant', icon: Store, active: pathname === '/merchant' },
            { label: 'Refund Financials', href: '/merchant#financials', icon: CreditCard, active: false },
            { label: 'High-Return Items', href: '/merchant#products', icon: Package, active: false },
            { label: 'Customers', href: '/', icon: Users, active: false }
          ]
        },
        {
          heading: 'FINANCIAL',
          items: [
            { label: 'Disputes & Claims', href: '/merchant#disputes', icon: Receipt, active: false },
            { label: 'Revenue Protected', href: '/merchant', icon: ShieldCheck, active: false }
          ]
        },
        {
          heading: 'TOOLS',
          items: [
            { label: 'Policy Settings', href: '/policy', icon: Settings, active: false },
            { label: 'Help & FAQ', href: '#', icon: HelpCircle, active: false }
          ]
        }
      ];
    } else {
      // Customer View
      return [
        {
          heading: 'MENU',
          items: [
            { label: 'Refund Claims', href: '/', icon: UserCheck, active: pathname === '/' },
            { label: 'My Orders', href: '/#orders', icon: Package, active: false },
            { label: 'Return Policies', href: '/policy', icon: FileText, active: pathname === '/policy' }
          ]
        },
        {
          heading: 'FINANCIAL',
          items: [
            { label: 'Claim Invoices', href: '#', icon: Receipt, active: false },
            { label: 'Store Credit', href: '#', icon: CreditCard, active: false }
          ]
        },
        {
          heading: 'TOOLS',
          items: [
            { label: 'AI Support Chat', href: '/#chat', icon: Sparkles, active: false },
            { label: 'Help & Contact', href: '#', icon: HelpCircle, active: false }
          ]
        }
      ];
    }
  };

  const navSections = getNavSections();

  const defaultUser = {
    name: activeView === 'admin' ? 'Ferra Alexandra' : activeView === 'merchant' ? 'Apex Retail Store' : 'Sarah Jenkins',
    role: activeView === 'admin' ? 'Admin store' : activeView === 'merchant' ? 'Store Merchant' : 'Verified Customer'
  };

  const profile = userProfile || defaultUser;

  return (
    <div className="min-h-screen bg-[#F3F4F9] text-slate-800 flex flex-col p-3 sm:p-5 lg:p-7 antialiased selection:bg-[#3861FB]/20 selection:text-[#3861FB]">
      <div className="flex-1 flex flex-col lg:flex-row gap-5 max-w-[1600px] w-full mx-auto">
        
        {/* DealDeck Style Left Sidebar */}
        <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 flex flex-col justify-between bg-white rounded-3xl p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] border border-slate-100">
          
          <div className="flex flex-col gap-6">
            {/* Brand Logo */}
            <div className="flex items-center justify-between px-1">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3861FB] to-[#5A82FF] flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">RevRescue</span>
                  <span className="text-[10px] text-slate-400 font-medium -mt-1">Deliberation System</span>
                </div>
              </Link>
            </div>

            {/* Navigation Groups */}
            <nav className="flex flex-col gap-4">
              {navSections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wider px-3 uppercase">
                    {section.heading}
                  </span>
                  <div className="flex flex-col gap-1 mt-1">
                    {section.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      return item.active ? (
                        <Link
                          key={itemIdx}
                          href={item.href}
                          className="bg-[#3861FB] text-white shadow-md shadow-blue-500/20 font-semibold rounded-2xl px-4 py-3 flex items-center gap-3.5 transition-all text-sm"
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      ) : (
                        <Link
                          key={itemIdx}
                          href={item.href}
                          className="text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-2xl px-4 py-3 flex items-center gap-3.5 transition-all text-sm group"
                        >
                          <Icon className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Bottom Area: SWITCH VIEW Button & Pro Card */}
          <div className="flex flex-col gap-3.5 pt-4 mt-6 border-t border-slate-100">
            
            {/* The SWITCH VIEW Component Requested by User */}
            <div className="relative" ref={switcherRef}>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer group"
                aria-expanded={isSwitcherOpen}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#3861FB]/10 text-[#3861FB] flex items-center justify-center">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Switch View</span>
                    <span className="text-xs text-slate-900 font-semibold truncate max-w-[120px]">
                      {viewOptions.find(v => v.id === activeView)?.label || 'Select View'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180 text-[#3861FB]' : ''}`} />
              </button>

              {/* Floating Dropdown for Switching Views */}
              {isSwitcherOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Workspace View
                    </span>
                    <span className="text-[10px] bg-blue-50 text-[#3861FB] font-semibold px-2 py-0.5 rounded-full">
                      Independent Views
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 mt-1">
                    {viewOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isCurrent = activeView === opt.id;
                      return (
                        <Link
                          key={opt.id}
                          href={opt.href}
                          onClick={() => setIsSwitcherOpen(false)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                            isCurrent
                              ? 'bg-blue-50/80 text-[#3861FB]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                            isCurrent ? 'bg-[#3861FB] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold leading-tight truncate">{opt.label}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-[#3861FB] flex-shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">
                              {opt.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* DealDeck Bottom Card: Pro Engine Status */}
            <div className="bg-[#161922] text-white rounded-2xl p-4 relative overflow-hidden shadow-md flex flex-col gap-2.5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#3861FB]/20 rounded-full blur-xl pointer-events-none"></div>

              <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>

              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Gemini Deliberation</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                  Deterministic gates + Gemini Flash active.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/policy"
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#3861FB] hover:bg-[#2F52E0] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  View Active Rules
                </Link>
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 gap-5">
          
          {/* DealDeck Style Top Header (NO TABS!) */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 px-1">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                {subtitle || todayFormatted}
              </p>
            </div>

            {/* Header Right Tools: Search, Notification Bell, User Avatar */}
            <div className="flex items-center gap-3">
              {headerActions}

              {/* Search Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-100 hover:shadow transition-all cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-100 hover:shadow transition-all cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                </button>
              </div>

              {/* Profile Pill */}
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-sm flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#3861FB] uppercase">
                    {profile.name.slice(0, 2)}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {profile.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium leading-tight">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Search bar expandable */}
          {searchOpen && (
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-100 flex items-center gap-3 animate-in fade-in duration-150">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                autoFocus
                placeholder="Search orders, tickets, policy rules or customer personas..."
                className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* View Body */}
          <main className="flex-1 flex flex-col gap-6">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
