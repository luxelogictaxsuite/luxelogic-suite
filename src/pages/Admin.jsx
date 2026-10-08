import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  Send, ClipboardList, Users, Inbox, UserCheck, UserPlus,
  ShoppingBag, MonitorPlay, Link2, FileText, LayoutTemplate,
  Clock, Settings, BookOpen, Store, HelpCircle, SlidersHorizontal,
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import EntityManager from '@/components/admin/EntityManager';
import ApplicationsList from '@/components/admin/ApplicationsList';
import PreparersManager from '@/components/admin/PreparersManager';
import FirmReturns from '@/components/admin/FirmReturns';
import FormBuilder from '@/components/admin/FormBuilder';
import BusinessHoursManager from '@/components/admin/BusinessHoursManager';
import SubmissionsList from '@/components/admin/SubmissionsList';
import SoftwarePurchasesManager from '@/components/admin/SoftwarePurchasesManager';
import PreparerSuiteConfig from '@/components/admin/PreparerSuiteConfig';
import {
  LINK_FIELDS, LINK_CREATE, SETTING_FIELDS, RESOURCE_FIELDS, RESOURCE_CREATE,
  PRODUCT_FIELDS, FORMLINK_FIELDS, WAITLIST_FIELDS, DEMO_FIELDS,
  PREPARER_FIELDS, PURCHASE_FIELDS, FAQ_FIELDS,
} from '@/components/admin/adminConfig';

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [{ id: 'returns', label: 'Firm Returns', icon: ClipboardList }],
  },
  {
    label: 'Clients',
    items: [
      { id: 'waitlist', label: 'Client Waitlist', icon: Users },
      { id: 'submissions', label: 'Submissions', icon: Inbox },
    ],
  },
  {
    label: 'Team',
    items: [
      { id: 'preparers', label: 'Preparers', icon: UserCheck },
      { id: 'applications', label: 'Applications', icon: UserPlus },
    ],
  },
  {
    label: 'Software',
    items: [
      { id: 'purchases', label: 'Software Purchases', icon: ShoppingBag },
      { id: 'demos', label: 'Demo Requests', icon: MonitorPlay },
    ],
  },
  {
    label: 'Site Content',
    items: [
      { id: 'links', label: 'Links Manager', icon: Link2 },
      { id: 'forms', label: 'Forms', icon: FileText },
      { id: 'form-builder', label: 'Form Builder', icon: LayoutTemplate },
      { id: 'hours', label: 'Business Hours', icon: Clock },
      { id: 'settings', label: 'Deadline & Contact', icon: Settings },
      { id: 'resources', label: 'Resources', icon: BookOpen },
      { id: 'products', label: 'Marketplace', icon: Store },
      { id: 'faqs', label: 'FAQs', icon: HelpCircle },
    ],
  },
  {
    label: 'Preparer Suite',
    items: [{ id: 'preparer-suite', label: 'Suite Customization', icon: SlidersHorizontal }],
  },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('returns');
  const [wlSending, setWlSending] = useState(false);
  const [wlResult, setWlResult] = useState('');

  const emailWaitlist = async () => {
    if (!confirm('Email every waiting client a link to start their intake? This marks them as Contacted.')) return;
    setWlSending(true); setWlResult('');
    try {
      const res = await base44.functions.invoke('notifyWaitlistSeasonOpen', {});
      const d = res.data || {};
      setWlResult(`Done — emailed ${d.emailed ?? 0} of ${d.total ?? 0} client(s).${d.skipped ? ` ${d.skipped} skipped (no email or failed).` : ''}`);
    } catch (e) { setWlResult(`Error: ${e.message || 'Something went wrong.'}`); }
    setWlSending(false);
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/suite" replace state={{ unauthorized: true }} />;
  }

  const currentLabel = NAV_GROUPS.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Admin';

  const renderContent = () => {
    switch (activeTab) {
      case 'returns':
        return <FirmReturns />;
      case 'links':
        return <EntityManager entity="SiteLink" queryKey="siteLinks" sort="key" fields={LINK_FIELDS} createFields={LINK_CREATE} stampUpdated intro="Paste a new URL and save — it updates everywhere that link appears on the site. This is where you edit 'Start My Return' (client_intake_form), 'Book a Consultation' (book_a_call), demo video links, and join_payment. Any link left blank falls back to emailing the office." />;
      case 'forms':
        return <EntityManager entity="FormLink" queryKey="formLinks" sort="sort_order" fields={FORMLINK_FIELDS} createFields={FORMLINK_FIELDS} canDelete intro="Client intake and specialist registrations are now native forms — manage them in the Form Builder tab. Use this tab only for any additional external links (e.g. IRS tools) you want listed in a site forms section." />;
      case 'form-builder':
        return <FormBuilder />;
      case 'submissions':
        return <SubmissionsList />;
      case 'hours':
        return <BusinessHoursManager />;
      case 'settings':
        return <EntityManager entity="SiteSetting" queryKey="siteSettings" sort="key" fields={SETTING_FIELDS} intro="Update the extension deadline (format: YYYY-MM-DDTHH:MM, Eastern time) and footer contact details (business_phone, business_email, business_address). Business hours and closure announcements are managed in the Business Hours tab." />;
      case 'resources':
        return <EntityManager entity="Resource" queryKey="resources" sort="sort_order" fields={RESOURCE_FIELDS} createFields={RESOURCE_CREATE} canDelete />;
      case 'products':
        return <EntityManager entity="MarketplaceProduct" queryKey="products" sort="sort_order" fields={PRODUCT_FIELDS} intro="Each product's payment link key points to an entry in the Links Manager." />;
      case 'applications':
        return <ApplicationsList />;
      case 'waitlist':
        return (
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-4 border border-border bg-secondary/40 p-5">
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-display text-2xl">Season is open?</h3>
                <p className="text-sm text-muted-foreground">Email every <em>Waiting</em> client a direct link to start their intake. Each one is marked Contacted after sending.</p>
              </div>
              <button onClick={emailWaitlist} disabled={wlSending} className="inline-flex h-11 items-center gap-2 bg-primary px-5 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
                <Send className="h-4 w-4" />{wlSending ? 'Sending…' : 'Email Waitlist — Season Open'}
              </button>
              {wlResult && <p className="w-full text-sm text-muted-foreground">{wlResult}</p>}
            </div>
            <EntityManager entity="ClientWaitlist" queryKey="waitlist" sort="-created_date" fields={WAITLIST_FIELDS} canDelete intro="Clients who joined the season waitlist from the Waitlist page." />
          </div>
        );
      case 'demos':
        return <EntityManager entity="DemoRequest" queryKey="demos" sort="-created_date" fields={DEMO_FIELDS} canDelete intro="Software demo requests from the Software page." />;
      case 'purchases':
        return <SoftwarePurchasesManager />;
      case 'faqs':
        return <EntityManager entity="FAQ" queryKey="faqs" sort="sort_order" fields={FAQ_FIELDS} canDelete intro="Add, edit, or reorder the questions shown in the Software page FAQ section. Toggle Live to hide without deleting." />;
      case 'preparers':
        return <PreparersManager />;
      case 'preparer-suite':
        return <PreparerSuiteConfig />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <AdminSidebar
        navGroups={NAV_GROUPS}
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onLogout={() => logout()}
      />
      <main className="flex-1 overflow-x-hidden pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
          <h1 className="mb-8 font-display text-3xl md:text-5xl">{currentLabel}</h1>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}