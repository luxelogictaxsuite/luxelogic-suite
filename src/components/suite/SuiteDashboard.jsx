import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  ClipboardList, FileCheck, FileText, LifeBuoy, DollarSign,
  ShieldCheck, GraduationCap, BookOpen, Settings,
  Clock, Package, AlertCircle, CheckCircle2
} from 'lucide-react';

const SECTIONS = [
  { id: 'queue', label: 'Return Queue', icon: ClipboardList, desc: 'Track every client return' },
  { id: 'dd', label: 'Due Diligence', icon: FileCheck, desc: 'Per-return compliance checklists' },
  { id: 'docs', label: 'Doc Requests', icon: FileText, desc: 'Request missing documents' },
  { id: 'support', label: 'Support', icon: LifeBuoy, desc: 'Tickets and client issues' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, desc: 'Commission by return' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, desc: 'CE hours and status' },
  { id: 'training', label: 'Training', icon: GraduationCap, desc: 'Sessions and attendance' },
  { id: 'resources', label: 'Resources', icon: BookOpen, desc: 'Articles and trusted links' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Account management' },
];

export default function SuiteDashboard() {
  const { me, assignments } = useOutletContext();
  const email = me.email;

  const { data: earnings = [] } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => base44.entities.Earning.list('-created_date', 500),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 500),
  });

  // Filter everything to this preparer's own data — no one sees firm totals in the Suite.
  const myEarnings = earnings.filter(e => e.preparer_email === email);
  const myTickets = tickets.filter(t => t.preparer_email === email);
  const pendingEarnings = myEarnings
    .filter(e => e.status === 'Pending')
    .reduce((s, e) => s + (e.preparer_share || 0), 0);
  const totalEarnings = myEarnings.reduce((s, e) => s + (e.preparer_share || 0), 0);
  const filed = assignments.filter(a => a.status === 'Filed' || a.status === 'Funded').length;
  const awaiting = assignments.filter(a => (a.status || 'Awaiting Documents') === 'Awaiting Documents').length;
  const ready = assignments.filter(a => a.status === 'Ready for Review').length;
  const openTickets = myTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  const stats = [
    { label: 'My Returns', value: assignments.length, icon: Package },
    { label: 'Filed', value: filed, icon: FileCheck },
    { label: 'Total Earnings', value: `$${totalEarnings.toFixed(0)}`, icon: DollarSign },
    { label: 'Pending Payout', value: `$${pendingEarnings.toFixed(0)}`, icon: CheckCircle2 },
  ];

  const metricFor = (id) => {
    if (id === 'queue') return assignments.length;
    if (id === 'support') return openTickets;
    if (id === 'earnings') return myEarnings.length;
    return null;
  };

  return (
    <div>
      {/* Stat tiles */}
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="eyebrow">{s.label}</p>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 font-display text-4xl">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Feature tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          const metric = metricFor(s.id);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={s.id}
                className="group flex h-full flex-col border border-border bg-background p-6 text-left transition hover:border-primary hover:bg-secondary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border border-border transition group-hover:border-primary group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {metric !== null && metric > 0 && (
                    <span className="font-mono text-xs text-muted-foreground">{metric}</span>
                  )}
                </div>
                <h3 className="mt-4 font-display text-xl">{s.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}