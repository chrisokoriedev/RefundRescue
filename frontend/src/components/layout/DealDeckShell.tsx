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
  X,
  Menu
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            { label: 'Revenue Protected', href: '/merchant', icon: ShieldAlert, active: false }
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="flex flex-col gap-5">
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#3861FB] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900">RevRescue</span>
              <span className="text-[10px] text-slate-400 font-medium -mt-1 tracking-tight">AI Deliberation</span>
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

        {/* Navigation Groups */}
        <nav className="flex flex-col gap-4 mt-1">
          {navSections.map((section, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider px-2.5 uppercase mb-1">
                {section.heading}
              </span>
              <div className="flex flex-col gap-1">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return item.active ? (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-[#3861FB] text-white shadow-xs font-semibold rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all text-xs"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <Link
                      key={itemIdx}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium rounded-xl px-3.5 py-2.5 flex items-center gap-3 transition-all text-xs group"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Area: SWITCH VIEW Button & Pro Status Card */}
      <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
        
        {/* Switch View Dropdown Component */}
        <div className="relative" ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-700 text-xs font-semibold transition-all cursor-pointer group"
            aria-expanded={isSwitcherOpen}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#3861FB]/10 text-[#3861FB] flex items-center justify-center">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Switch View</span>
                <span className="text-xs text-slate-900 font-semibold truncate max-w-[130px]">
                  {viewOptions.find(v => v.id === activeView)?.label || 'Select View'}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180 text-[#3861FB]' : ''}`} />
          </button>

          {/* Floating Dropdown for Switching Views */}
          {isSwitcherOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Workspace View
                </span>
                <span className="text-[9px] bg-blue-50 text-[#3861FB] font-bold px-2 py-0.5 rounded-full">
                  Independent
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
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-start gap-2 p-2 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-[#3861FB]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md flex-shrink-0 mt-0.5 ${
                        isCurrent ? 'bg-[#3861FB] text-white' : 'bg-slate-100 text-slate-500'
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

        {/* Bottom Card: Pro Engine Status */}
        <div className="bg-[#12141C] text-white rounded-xl p-3.5 relative overflow-hidden shadow-xs flex flex-col gap-2">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#3861FB]/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">
              Gemini Deliberation
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
              Deterministic gates + Gemini Flash active.
            </p>
          </div>

          <div className="pt-0.5">
            <Link
              href="/policy"
              className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#3861FB] hover:bg-[#2F52E0] text-white text-xs font-semibold transition-colors"
            >
              View Active Rules
            </Link>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#F3F4F9] text-slate-800 flex antialiased selection:bg-[#3861FB]/20 selection:text-[#3861FB]">
      
      {/* ── 1. Drawer Sticks to Left Edge (Fixed Full-Height Sidebar) ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 h-screen z-40 bg-white border-r border-slate-200/80 flex-col overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-72 bg-white h-full z-10 shadow-2xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* ── 2. Full-Screen Main Content Column (pl-64 on desktop) ── */}
      <div className="flex-1 w-full lg:pl-64 xl:pl-72 flex flex-col min-h-screen">
        
        {/* ── 3. Top Panel Sticks Directly to Top (Sticky Header) ── */}
        <header className="sticky top-0 z-30 w-full bg-[#F3F4F9]/95 backdrop-blur-md border-b border-slate-200/70 px-5 sm:px-8 py-3.5 flex items-center justify-between transition-shadow">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-[11px] font-medium text-slate-400 -mt-0.5">
                {subtitle || todayFormatted}
              </p>
            </div>
          </div>

          {/* Header Right Tools: Actions, Search, Notification Bell, User Avatar */}
          <div className="flex items-center gap-2.5">
            {headerActions}

            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </button>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200/80 ml-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-2xs flex-shrink-0">
                <div className="w-full h-full rounded-md bg-white flex items-center justify-center text-[11px] font-bold text-[#3861FB] uppercase">
                  {profile.name.slice(0, 2)}
                </div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {profile.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Expandable Search Input */}
        {searchOpen && (
          <div className="w-full bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-3 animate-in fade-in duration-150">
            <Search className="w-4 h-4 text-slate-400" />
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

        {/* ── 4. Main Body: Full Screen Width (No mx-auto max-w constraint) ── */}
        <main className="flex-1 w-full px-5 sm:px-8 py-6 flex flex-col gap-6">
          {children}
        </main>
      </div>

    </div>
  );
}
