import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import ChoiceGroup from '@/components/join/ChoiceGroup';
import { Check, FileText } from 'lucide-react';

const MAP = { 'TaxSlayer Pro': 'taxslayer_pro', 'OLT Pro': 'olt_pro' };

const INCLUDED = [
  'Set your own service bureau fee on every return',
  'Get paid out in real time as returns fund',
  'Add sub-offices and EROs under your bureau',
  'Service bureau fee and transmitter fees deducted from returns',
  'Bank product integration built in',
  'Dedicated onboarding and ongoing support',
  'ERO Suite portal access for your preparers',
];

export default function ServiceBureauCard() {
  const [software, setSoftware] = useState('');
  return (
    <div className="grid gap-10 border border-border bg-card p-8 md:grid-cols-2 md:p-12">
      <div>
        <p className="eyebrow">Become a Service Bureau</p>
        <p className="mt-3 font-display text-8xl">$997</p>
        <p className="mt-2 text-sm text-muted-foreground">one-time setup fee</p>
        <p className="mt-6 text-muted-foreground">
          Launch your own service bureau on LuxeLogic infrastructure. You set your service bureau fee, manage your offices, and get paid as returns fund — we handle the software, banking, and backend.
        </p>
        <ul className="mt-8 space-y-3">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-end gap-6">
        <div className="border border-border bg-background p-6">
          <p className="eyebrow mb-3">How you get paid</p>
          <p className="text-sm text-muted-foreground">
            Fees are collected through the client's bank product (refund transfer). Service bureau fees are paid out in real time as the returns fund — no invoicing, no chasing payments.
          </p>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">When it goes live:</strong> Your bureau relationship goes live once your agreement is signed and your software is built — typically 10–15 days after purchase.
          </p>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Support included:</strong> Dedicated onboarding, ongoing technical support, and access to the ERO Suite portal for managing your preparers and returns.
          </p>
          <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Minimums:</strong> No minimum return volume. You keep what you earn from day one.
          </p>
        </div>
        <p className="eyebrow">Select base software</p>
        <ChoiceGroup options={Object.keys(MAP)} value={software} onChange={setSoftware} />
        {software ? (
          <div className="space-y-3">
            <SiteLinkButton linkKey="payment_service_bureau" size="lg" params={{ client_reference_id: MAP[software] }}>Purchase — {software}</SiteLinkButton>
            <Link to="/form/service-bureau-application" className="inline-flex h-14 w-full items-center justify-center gap-2 border border-foreground/30 px-8 font-medium text-foreground transition hover:border-highlight hover:text-highlight">
              <FileText className="h-4 w-4" /> Submit Application
            </Link>
          </div>
        ) : (
          <Link to="/form/service-bureau-application" className="inline-flex h-14 w-full items-center justify-center gap-2 border border-dashed border-border px-6 text-sm text-muted-foreground transition hover:border-highlight hover:text-highlight">
            <FileText className="h-4 w-4" /> Submit Service Bureau Application
          </Link>
        )}
      </div>
    </div>
  );
}