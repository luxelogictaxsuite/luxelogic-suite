import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, ArrowLeft, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Suite() {
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });
  const isAdmin = me?.role === 'admin';
  const { data: preparerRows = [], isLoading: prepLoading } = useQuery({
    queryKey: ['myPreparerRecord', me?.email],
    queryFn: () => base44.entities.Preparer.filter({ email: me.email }),
    enabled: !!me && !isAdmin,
  });
  // Load assignments — RLS returns only this preparer's rows (admins see all;
  // we filter client-side below so admins using the Suite see only their own).
  const { data: allAssignments = [], isLoading: loadingAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: ['myAssignments', me?.email],
    queryFn: () => base44.entities.ClientAssignment.list('-created_date', 200),
    enabled: !!me && (isAdmin || preparerRows.length > 0),
  });
  // Filter to own returns only — no one sees the firm's totals in the Suite.
  const assignments = me ? allAssignments.filter((a) => a.preparer_email === me.email) : [];

  const qc = useQueryClient();
  // Real-time: any create/update/delete to assignments, earnings, or tickets
  // instantly refreshes the preparer's dashboard — no manual reload needed.
  useEffect(() => {
    if (!me) return;
    const keys = ['myAssignments', 'earnings', 'tickets'];
    const unsubscribers = keys.map((k) =>
      base44.entities[k === 'myAssignments' ? 'ClientAssignment' : k === 'earnings' ? 'Earning' : 'SupportTicket'].subscribe((event) => {
        qc.invalidateQueries({ queryKey: [k, me.email] });
        qc.invalidateQueries({ queryKey: [k] });
      })
    );
    return () => unsubscribers.forEach((u) => u && u());
  }, [me, qc]);

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isSubRoute = location.pathname !== '/suite';
  const { logout } = useAuth();

  if (meLoading || (!isAdmin && prepLoading) || !me) {
    return <div className="mx-auto max-w-7xl px-5 py-24"><div className="h-64 animate-pulse bg-card" /></div>;
  }

  const isPreparer = isAdmin || preparerRows.length > 0;
  if (!isPreparer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-5xl">Access locked.</h1>
        <p className="text-muted-foreground">The Preparer Suite is reserved for authorized LuxeLogic preparers and administrators.</p>
        <Link to="/" className="text-primary hover:underline">Back to the site</Link>
      </div>
    );
  }

  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    if (window.scrollY === 0 && delta > 0) setPull(Math.min(delta, 100));
  };
  const onTouchEnd = async () => {
    if (pull > 70 && !refreshing) {
      setRefreshing(true);
      try { await refetchAssignments(); } catch {}
      setRefreshing(false);
    }
    setPull(0);
  };

  return (
    <div
      className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {location.state?.unauthorized && (
        <div className="mb-4 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <strong>Unauthorized access.</strong> You don't have permission to view the Admin Suite. You've been redirected to the Preparer Suite.
        </div>
      )}
      {(refreshing || pull > 0) && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground" style={{ opacity: refreshing ? 1 : Math.min(pull / 70, 1) }}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Pull to refresh'}
        </div>
      )}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </button>
        <button onClick={() => logout()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
      <p className="eyebrow mb-4">Preparer Suite</p>
      <h1 className="font-display text-5xl md:text-7xl">Your Suite</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Everything for your season — returns, documents, earnings, compliance and training.
      </p>
      <div className="mt-10">
        {isSubRoute && (
          <button
            onClick={() => navigate('/suite')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        )}
        <Outlet context={{ me, assignments }} />
      </div>
    </div>
  );
}