export const LINK_FIELDS = [
  { key: 'key', label: 'Key', readOnly: true, span: 'md:col-span-3' },
  { key: 'label', label: 'Label', span: 'md:col-span-3' },
  { key: 'url', label: 'URL', type: 'url', span: 'md:col-span-4' },
];
export const LINK_CREATE = [
  { key: 'key', label: 'Key (e.g. my_new_link)', required: true },
  { key: 'label', label: 'Label', required: true },
  { key: 'url', label: 'URL', type: 'url', span: 'md:col-span-4' },
];

export const SETTING_FIELDS = [
  { key: 'label', label: 'Setting', readOnly: true, span: 'md:col-span-4' },
  { key: 'value', label: 'Value', span: 'md:col-span-6' },
];

const RES = [
  { key: 'title', label: 'Title', required: true, span: 'md:col-span-3' },
  { key: 'url', label: 'Link', type: 'url', required: true, span: 'md:col-span-3' },
  { key: 'description', label: 'Short description', span: 'md:col-span-3' },
  { key: 'category', label: 'Type', type: 'select', options: ['Article', 'FAQ', 'Link'], span: 'md:col-span-1' },
];
export const RESOURCE_FIELDS = [...RES.slice(0, 3), { ...RES[3] }];
export const RESOURCE_CREATE = RES.map((f) => ({ ...f, span: f.key === 'category' ? 'md:col-span-1' : 'md:col-span-3' }));

export const PRODUCT_FIELDS = [
  { key: 'brand', label: 'Brand', span: 'md:col-span-2' },
  { key: 'name', label: 'Name', span: 'md:col-span-2' },
  { key: 'price', label: 'Price $', type: 'number', span: 'md:col-span-1' },
  { key: 'seats_included', label: 'Seats', type: 'number', span: 'md:col-span-1' },
  { key: 'extra_seat_price', label: "Add'l seat $", type: 'number', span: 'md:col-span-1' },
  { key: 'link_key', label: 'Payment link key', span: 'md:col-span-2' },
  { key: 'active', label: 'Live', type: 'checkbox', span: 'md:col-span-1' },
];

export const FORMLINK_FIELDS = [
  { key: 'title', label: 'Title', required: true, span: 'md:col-span-3' },
  { key: 'category', label: 'Section', type: 'select', options: ['Tax Clients', 'Join Team', 'Software', 'General'], span: 'md:col-span-2' },
  { key: 'url', label: 'Form URL', type: 'url', required: true, span: 'md:col-span-4' },
  { key: 'sort_order', label: 'Order', type: 'number', span: 'md:col-span-1' },
  { key: 'active', label: 'Live', type: 'checkbox', span: 'md:col-span-1' },
  { key: 'description', label: 'Description', type: 'textarea', span: 'md:col-span-6' },
];

export const WAITLIST_FIELDS = [
  { key: 'full_name', label: 'Name', span: 'md:col-span-2' },
  { key: 'phone', label: 'Phone', span: 'md:col-span-2' },
  { key: 'email', label: 'Email', span: 'md:col-span-2' },
  { key: 'dependents', label: 'Dependents', type: 'number', span: 'md:col-span-1' },
  { key: 'filing_status', label: 'Filing status', span: 'md:col-span-2' },
  { key: 'preparer_name', label: 'Chosen preparer', span: 'md:col-span-2' },
  { key: 'preferred_contact', label: 'Contact via', span: 'md:col-span-1' },
  { key: 'status', label: 'Status', type: 'select', options: ['Waiting', 'Contacted', 'Onboarded'], span: 'md:col-span-2' },
];

export const PREPARER_FIELDS = [
  { key: 'name', label: 'Name (must match intake dropdown)', required: true, span: 'md:col-span-3' },
  { key: 'email', label: 'Email (their app login)', span: 'md:col-span-3' },
  { key: 'ptin', label: 'PTIN', span: 'md:col-span-2' },
  { key: 'phone', label: 'Phone', span: 'md:col-span-2' },
  { key: 'comp_tier', label: 'Comp tier', type: 'select', options: ['70/30', '80/20'], span: 'md:col-span-2' },
  { key: 'ce_hours_completed', label: 'CE done', type: 'number', span: 'md:col-span-2' },
  { key: 'ce_hours_required', label: 'CE req', type: 'number', span: 'md:col-span-2' },
  { key: 'training_seat_key', label: 'Boot Camp seat key', span: 'md:col-span-4' },
  { key: 'active', label: 'Active', type: 'checkbox', span: 'md:col-span-2' },
];

export const DEMO_FIELDS = [
  { key: 'full_name', label: 'Name', span: 'md:col-span-2' },
  { key: 'software', label: 'Software', span: 'md:col-span-2' },
  { key: 'email', label: 'Email', span: 'md:col-span-2' },
  { key: 'phone', label: 'Phone', span: 'md:col-span-2' },
  { key: 'efin', label: 'EFIN', span: 'md:col-span-1' },
  { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Scheduled'], span: 'md:col-span-1' },
  { key: 'office_size', label: 'Office size', type: 'textarea', span: 'md:col-span-6' },
];

export const FAQ_FIELDS = [
  { key: 'question', label: 'Question', required: true, span: 'md:col-span-6' },
  { key: 'answer', label: 'Answer', type: 'textarea', span: 'md:col-span-6' },
  { key: 'category', label: 'Category', type: 'select', options: ['Software', 'General'], span: 'md:col-span-2' },
  { key: 'sort_order', label: 'Order', type: 'number', span: 'md:col-span-2' },
  { key: 'active', label: 'Live', type: 'checkbox', span: 'md:col-span-2' },
];

export const PURCHASE_FIELDS = [
  { key: 'full_name', label: 'Name', span: 'md:col-span-2' },
  { key: 'software', label: 'Software', span: 'md:col-span-2' },
  { key: 'email', label: 'Email', span: 'md:col-span-2' },
  { key: 'phone', label: 'Phone', span: 'md:col-span-2' },
  { key: 'efin', label: 'EFIN', span: 'md:col-span-1' },
  { key: 'status', label: 'Status', type: 'select', options: ['New', 'Registration Sent', 'Registered', 'Build Started', 'Completed'], span: 'md:col-span-1' },
  { key: 'amount_paid', label: 'Amount $', type: 'number', span: 'md:col-span-1' },
  { key: 'office_size', label: 'Office size', type: 'textarea', span: 'md:col-span-6' },
  { key: 'notes', label: 'Notes', type: 'textarea', span: 'md:col-span-6' },
];