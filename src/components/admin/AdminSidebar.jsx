import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, ExternalLink } from 'lucide-react';
import { LOGO_FULL } from '@/lib/brand';

export default function AdminSidebar({ navGroups, activeTab, onNavigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-6 border-b border-border">
        <img src={LOGO_FULL} alt="LuxeLogic Tax Suite" className="h-8" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`group relative mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-highlight' : ''}`} />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-highlight" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-4">
        <Link
          to="/"
          className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View Site
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-center bg-white px-4 border-b border-border md:hidden">
        <button onClick={() => setMobileOpen(true)} className="absolute left-4 text-muted-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <img src={LOGO_FULL} alt="LuxeLogic Tax Suite" className="h-7" />
        <button onClick={onLogout} className="absolute right-4 text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}