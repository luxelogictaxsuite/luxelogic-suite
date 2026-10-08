// Rough federal estimate using tax year 2026 IRS figures (for the upcoming season). Not tax advice.
const STD = { single: 16100, mfj: 32200, hoh: 24150, mfs: 16100, qss: 32200 };
const BRACKETS = {
  single: [[12400, 0.1], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
  mfj: [[24800, 0.1], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
  hoh: [[17700, 0.1], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]],
  mfs: [[12400, 0.1], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [384350, 0.35], [Infinity, 0.37]],
  qss: [[24800, 0.1], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
};
const CTC_PHASEOUT = { single: 200000, hoh: 200000, mfs: 200000, mfj: 400000, qss: 400000 };

export function estimateRefund({ status, income, dependents, withheld }) {
  const taxable = Math.max(0, income - STD[status]);
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of BRACKETS[status]) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
  }
  const reduction = Math.ceil(Math.max(0, income - CTC_PHASEOUT[status]) / 1000) * 50;
  const credit = Math.max(0, dependents * 2200 - reduction);
  const nonRefundable = Math.min(credit, tax);
  const refundableCap = Math.min(dependents * 1700, Math.max(0, (income - 2500) * 0.15));
  const refundable = Math.min(credit - nonRefundable, refundableCap);
  const liability = tax - nonRefundable;
  return { taxable, tax: Math.round(tax), liability: Math.round(liability), result: Math.round(withheld + refundable - liability) };
}