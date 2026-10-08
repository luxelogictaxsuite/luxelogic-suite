import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Package, Mail, LayoutDashboard, Shield } from 'lucide-react';
import { useIsPreparer } from '@/hooks/useIsPreparer';

const BASE_TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/tax-clients', label: 'Taxes', icon: Users },
  { to: '/software', label: 'Software', icon: Package },
  { to: '/contact', label: 'Contact', icon: Mail },
];
const SUITE_TAB = { to: '/suite', label: 'Suite', icon: LayoutDashboard };
const ADMIN_TAB = { to: '/admin', label: 'Admin', icon: Shield };

export default function BottomTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isPreparer, isAdmin } = useIsPreparer();

  let TABS = [...BASE_TABS];
  if (isPreparer) TABS = [...TABS, SUITE_TAB];
  if (isAdmin) TABS = [...TABS, ADMIN_TAB];

  const isActive = (t) => (t.end ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + '/'));

  const onTap = (t) => {
    if (isActive(t)) {
      navigate(t.to, { replace: pathname === t.to });
    } else {
      navigate(t.to);
    }
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((t) => {
          const active = isActive(t);
          return (
            <button
              key={t.to}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onTap(t)}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}