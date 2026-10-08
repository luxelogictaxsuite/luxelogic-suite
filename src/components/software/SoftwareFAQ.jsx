import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Section from '@/components/site/Section';
import { Plus, Minus } from 'lucide-react';

const FALLBACK_FAQS = [
  { q: 'Do I need an EFIN?', a: 'Yes. An EFIN (Electronic Filing Identification Number) is required to purchase professional tax software and e-file returns. You can apply for one at irs.gov. We also collect your PTIN during onboarding.' },
  { q: 'Which software is right for me?', a: 'If you prepare primarily individual returns and want strong client-facing tools, TaxSlayer Pro is an excellent choice. If you need to prepare both individual and business returns in one platform, OLT Pro is the better fit. See the comparison table above for a detailed breakdown.' },
  { q: 'How fast do I get access?', a: 'Once you purchase and complete your software registration, access is typically activated within 24–48 hours.' },
  { q: 'Are business returns included?', a: 'OLT Pro includes both individual and business returns. TaxSlayer Pro covers individual returns plus business returns on desktop mode. Choose OLT Pro if you need cloud-based business filing.' },
  { q: 'What support is provided?', a: 'Every purchase includes full LuxeLogic support: software onboarding, bank enrollment assistance, software training videos, live CE education, marketing guidance, one-on-one coaching, backend and technical support, workflow setup, and support before, during, and after tax season. See the full list in the "What LuxeLogic Does for You" section above.' },
  { q: 'Can I add preparers?', a: 'Yes. You can add preparers and sub-offices to your software at any time. Contact us and we will handle the setup.' },
  { q: 'Which banks are available?', a: 'LuxeLogic offices can offer bank products through Refund Advantage, Santa Barbara TPG, and Republic Bank. See the Banking Products section above for details on what each offers and their fee ranges.' },
  { q: 'Are there additional or per-return fees?', a: 'The software price ($399 per season) covers unlimited e-filed returns for the season — there is no per-return software fee. Bank product fees apply when a client chooses to have their preparer fee deducted from their refund via a refund transfer; those fees are set by the bank, not LuxeLogic.' },
  { q: 'Is training included?', a: 'Software training videos are included with your purchase. Live continuing education (CE) courses are available separately through our Marketplace and are included with the $149 Join the Team membership.' },
  { q: 'What is the refund policy?', a: 'Our refund policy is available on the site — linked above, near the purchase buttons. Review it and the software agreement before purchasing.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="font-display text-lg md:text-xl">{q}</span>
        {open ? <Minus className="h-5 w-5 shrink-0 text-muted-foreground" /> : <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-5 text-sm text-muted-foreground">{a}</p>}
    </div>
  );
}

export default function SoftwareFAQ({ num = '07' }) {
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => base44.entities.FAQ.filter({ active: true, category: 'Software' }, 'sort_order'),
  });
  const items = (faqs?.length ? faqs.map(f => ({ q: f.question, a: f.answer })) : FALLBACK_FAQS);
  return (
    <Section num={num} eyebrow="FAQ" title="Questions before you buy.">
      <div className="max-w-3xl">
        {items.map((f, i) => <FAQItem key={f.q || i} {...f} />)}
      </div>
    </Section>
  );
}