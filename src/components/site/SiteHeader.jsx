import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, LogOut, LogIn, ChevronDown, LayoutDashboard, Shield } from 'lucide-react';
import { LOGO_FULL, LOGO_ICON } from '@/lib/brand';
import { useIsPreparer } from '@/hooks/useIsPreparer';
import { useAuth } from '@/lib/AuthContext';

const NAV_GROUPS = [
  { label: 'Tax Clients', to: '/tax-clients', children: [
    { to: '/tax-clients', label: 'Tax Clients' },
    { to: '/waitlist', label: 'Tax Waitlist' },
  ]},
  { label: 'Tax Professionals', to: '/software', children: [
    { to: '/software', label: 'EROs & Software' },
    { to: '/what-luxelogic-does', label: 'What LuxeLogic Does for You' },
    { to: '/join', label: 'Join the Team' },
  ]},
  { label: 'Training', to: '/live-education', children: [
    { to: '/live-education', label: 'Live Education' },
    { to: '/marketplace', label: 'Marketplace' },
  ]},
  { label: 'SmartWiz AI', to: '/smartwiz' },
  { label: 'Contact', to: '/contact' },
];

const MOBILE_NAV = [
  { to: '/tax-clients', label: 'Tax Clients' },
  { to: '/waitlist', label: 'Tax Waitlist' },
  { to: '/software', label: 'EROs & Software' },
  { to: '/join', label: 'Join the Team' },
  { to: '/live-education', label: 'Live Education' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/smartwiz', label: 'SmartWiz AI' },
  { to: '/contact', label: 'Contact' },
];

function NavItem({ item }) {
  const [open, setOpen] = useState(false);
  if (!item.children) {
    return (
      <NavLink to={item.to} className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
        {item.label}
      </NavLink>
    );
  }
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <NavLink to={item.to} className={({ isActive }) => `flex items-center gap-1 text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
        {item.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </NavLink>
      {open && (
        <div className="absolute left-0 top-full pt-3 z-50">
          <div className="border border-border bg-background py-2 shadow-xl min-w-[200px]">
            {item.children.map((c) => (
              <Link key={c.to} to={c.to} className="block px-5 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const NAV = NAV_GROUPS;

export default function SiteHeader({ className = '' }) {
  const [open, setOpen] = useState(false);
  const { isPreparer, isAdmin, user, isAuthenticated } = useIsPreparer();
  const { logout } = useAuth();
  const handleLogout = () => { setOpen(false); logout('/'); };

  return (
    <header className={`sticky top-0 z-40 border-b border-border bg-background/85 pt-safe backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src={LOGO_FULL} alt="LuxeLogic Tax Suite" className="hidden h-9 w-auto md:block" />
          <img src={LOGO_ICON} alt="LuxeLogic Tax Suite" className="h-9 w-auto md:hidden" />
        </Link>
        <nav className="hidden items-center gap-5 whitespace-nowrap lg:flex">
          {NAV_GROUPS.map((item) => <NavItem key={item.label} item={item} />)}
          {isAuthenticated && isPreparer && (
            <NavLink to="/suite" className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Preparer Suite
            </NavLink>
          )}
          {isAuthenticated && isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Admin Suite
            </NavLink>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          )}
        </nav>
        <button aria-label={open ? 'Close menu' : 'Open menu'} className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-5 py-4 lg:hidden">
          {MOBILE_NAV.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block border-b border-border/60 py-3 font-display text-2xl">
              {n.label}
            </Link>
          ))}
          <div className="pt-4 space-y-2">
            {isAuthenticated && isPreparer && (
              <Link to="/suite" onClick={() => setOpen(false)} className="flex items-center gap-2 border border-border py-3 px-4 text-sm">
                <LayoutDashboard className="h-4 w-4" /> Preparer Suite
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 border border-border py-3 px-4 text-sm">
                <Shield className="h-4 w-4" /> Admin Suite
              </Link>
            )}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm text-primary-foreground">
                <LogOut className="h-4 w-4" /> Logout{user?.email ? ` (${user.email})` : ''}
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 bg-primary py-3 text-sm text-primary-foreground">
                <LogIn className="h-4 w-4" /> Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}