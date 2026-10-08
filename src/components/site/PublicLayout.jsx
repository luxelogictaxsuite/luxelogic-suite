import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import DeadlineTicker from '@/components/site/DeadlineTicker';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import BottomTabs from '@/components/site/BottomTabs';
import ClosurePopup from '@/components/site/ClosurePopup';

// Primary nav roots keep the desktop header/footer chrome on mobile.
// Deeper routes (e.g. /form/:id) hide it for a focused sub-screen.
const PRIMARY_ROOTS = new Set([
  '/', '/tax-clients', '/waitlist', '/suite', '/join',
  '/live-education', '/software', '/marketplace', '/smartwiz',
]);

export default function PublicLayout() {
  const { pathname } = useLocation();
  const isDeep = !PRIMARY_ROOTS.has(pathname);
  const chromeClass = isDeep ? 'hidden md:block' : '';

  return (
    <div className="min-h-screen bg-background">
      <a href="#main" className="sr-only z-50 bg-primary px-6 py-3 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-0 focus:right-0 focus:top-0 focus:block focus:text-center">
        Skip to content
      </a>
      <DeadlineTicker />
      <SiteHeader className={chromeClass} />
      <main id="main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <div className={chromeClass}>
        <SiteFooter />
      </div>
      <div className="h-16 md:hidden" aria-hidden />
      <BottomTabs />
      <ClosurePopup />
    </div>
  );
}