/**
 * translations.ts — UI-specific bilingual dictionary for the reports dashboard.
 *
 * Extends the shared WN_I18N from api-contracts with app-level UI labels.
 * All user-facing strings in the reporting app should be defined here.
 *
 * Urdu text uses Nastaliq script. The app loads "Noto Nastaliq Urdu" via CSS.
 */

export type Lang = 'en' | 'ur';

/** A bilingual string pair */
export type Bilingual = Record<Lang, string>;

// ── Navigation & Pages ───────────────────────────────────────────────

// ── Nav labels (kept for existing references) ────────────────

export const NAV = {
    dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
    tajneed: { en: 'Tajneed', ur: 'طاجنید' },
    tajneedMenuSubtitle: {
        en: 'Select a section to explore member data, analytics, and reports.',
        ur: 'اراکین کے ڈیٹا، تجزیات اور رپورٹس کو دریافت کرنے کے لیے ایک سیکشن منتخب کریں۔',
    },
    tajneedDataTitle: { en: 'View Data', ur: 'ڈیٹا دیکھیں' },
    tajneedDataDesc: {
        en: 'Browse and search the full members register with filters and export.',
        ur: 'مکمل ممبران رجسٹر کو فلٹرز اور ایکسپورٹ کے ساتھ براؤز اور تلاش کریں۔',
    },
    tajneedAnalyticsTitle: { en: 'Analytics', ur: 'تجزیات' },
    tajneedAnalyticsDesc: {
        en: 'Visual insights, charts, and trends across the membership.',
        ur: 'ممبرشپ میں بصری بصیرت، چارٹس اور رجحانات۔',
    },
    tajneedReportsTitle: { en: 'Reports', ur: 'رپورٹس' },
    tajneedReportsDesc: {
        en: 'Generate and download formatted reports for Jama\'at use.',
        ur: 'جماعت کے استعمال کے لیے فارمیٹ شدہ رپورٹس تیار اور ڈاؤن لوڈ کریں۔',
    },
    tajneedSettingsTitle: { en: 'Settings', ur: 'ترتیبات' },
    tajneedSettingsDesc: {
        en: 'Manage columns, display preferences, and data sources.',
        ur: 'کالمز، ڈسپلے ترجیحات اور ڈیٹا کے ذرائع کا نظم کریں۔',
    },
    reports: { en: 'Reports', ur: 'رپورٹس' },
    settings: { en: 'Settings', ur: 'ترتیبات' },
} as const satisfies Record<string, Bilingual>;

// ── Dashboard Labels ─────────────────────────────────────────────────

export const DASHBOARD = {
    title: { en: 'Waqf-e-Nau Reports', ur: 'وقفِ نو رپورٹس' },
    subtitle: {
        en: 'Data insights for members, forms, and activities',
        ur: 'اراکین، فارمز اور سرگرمیوں کے ڈیٹا سے بصیرت',
    },
    totalMembers: { en: 'Total Members', ur: 'کل اراکین' },
    tallyForms: { en: 'Tally Forms', ur: 'ٹیلی فارمز' },
    dataSources: { en: 'Data Sources', ur: 'ڈیٹا کے ذرائع' },
    recentRegistrations: { en: 'Recent Registrations', ur: 'حالیہ اندراجات' },
    noData: { en: 'No data yet.', ur: 'ابھی ڈیٹا نہیں ہے۔' },
    comingSoon: { en: 'Coming Soon', ur: 'جلد آرہا ہے' },
    comingSoonDesc: {
        en: 'Charts, tables, and SQL query editor will be added in upcoming iterations.',
        ur: 'چارٹس، ٹیبلز اور SQL استفسار ایڈیٹر آئندہ اپ ڈیٹس میں شامل کیے جائیں گے۔',
    },
    footer: {
        en: 'Waqf-e-Nau Reports · Ahmadiyya Muslim Community Australia',
        ur: 'وقفِ نو رپورٹس · احمدیہ مسلم کمیونٹی آسٹریلیا',
    },
    error: { en: 'Error', ur: 'خرابی' },
    loading: { en: 'Loading…', ur: 'لوڈ ہو رہا ہے…' },
} as const satisfies Record<string, Bilingual>;

// ── Tajneed Page ──────────────────────────────────────────────────────

export const TAJNEED = {
    title: { en: 'Tajneed — Members', ur: 'طاجنید — اراکین' },
    searchPlaceholder: {
        en: 'Search by name, jamaat, phone…',
        ur: 'نام، جماعت، فون کے ذریعے تلاش کریں…',
    },
    filterStatus: { en: 'Status', ur: 'حیثیت' },
    filterGender: { en: 'Gender', ur: 'جنس' },
    filterJamaat: { en: 'Jama\'at', ur: 'جماعت' },
    allStatuses: { en: 'All Statuses', ur: 'تمام حیثیتیں' },
    allGenders: { en: 'All Genders', ur: 'تمام جنس' },
    allJamaats: { en: 'All Jama\'ats', ur: 'تمام جماعتیں' },
    rowsPerPage: { en: 'Rows per page', ur: 'فی صفحہ قطاریں' },
    pageOf: { en: 'Page {current} of {total}', ur: 'صفحہ {current} از {total}' },
    statusActive: { en: 'Active', ur: 'فعال' },
    statusInactive: { en: 'Inactive', ur: 'غیر فعال' },
    statusDeceased: { en: 'Deceased', ur: 'متوفی' },
    statusLeft: { en: 'Left', ur: 'چھوڑ دیا' },
    genderMale: { en: 'Male', ur: 'مرد' },
    genderFemale: { en: 'Female', ur: 'خاتون' },
} as const satisfies Record<string, Bilingual>;

// ── Column Headers (auto-detected from Arrow schema) ─────────────────

/**
 * Friendly bilingual labels for known members table columns.
 * Keys match the column names in the members.parquet Arrow schema.
 */
export const COLUMNS: Record<string, Bilingual> = {
    given_names: { en: 'Given Name(s)', ur: 'نام' },
    family_name: { en: 'Family Name', ur: 'خاندانی نام' },
    gender: { en: 'Gender', ur: 'جنس' },
    primary_phone: { en: 'Primary Phone', ur: 'بنیادی فون' },
    secondary_phone: { en: 'Secondary Phone', ur: 'ثانوی فون' },
    jamaat: { en: "Jama'at", ur: 'جماعت' },
    age: { en: 'Age', ur: 'عمر' },
    age_group: { en: 'Age Group', ur: 'عمر گروپ' },
    father_given_names: { en: "Father's Given Name(s)", ur: 'والد کا نام' },
    father_family_name: { en: "Father's Family Name", ur: 'والد کا خاندانی نام' },
    father_phone: { en: "Father's Phone", ur: 'والد کا فون' },
    mother_given_names: { en: "Mother's Given Name(s)", ur: 'والدہ کا نام' },
    mother_family_name: { en: "Mother's Family Name", ur: 'والدہ کا خاندانی نام' },
    mother_phone: { en: "Mother's Phone", ur: 'والدہ کا فون' },
    grandfather_given_names: { en: "Grandfather's Given Name(s)", ur: 'دادا کا نام' },
    grandfather_family_name: { en: "Grandfather's Family Name", ur: 'دادا کا خاندانی نام' },
};

// ── Common UI Controls ───────────────────────────────────────────────

export const UI = {
    search: { en: 'Search', ur: 'تلاش' },
    clear: { en: 'Clear', ur: 'صاف کریں' },
    apply: { en: 'Apply', ur: 'لاگو کریں' },
    cancel: { en: 'Cancel', ur: 'منسوخ کریں' },
    close: { en: 'Close', ur: 'بند کریں' },
    save: { en: 'Save', ur: 'محفوظ کریں' },
    delete: { en: 'Delete', ur: 'حذف کریں' },
    edit: { en: 'Edit', ur: 'ترمیم' },
    confirm: { en: 'Confirm', ur: 'تصدیق کریں' },
    noResults: { en: 'No results found.', ur: 'کوئی نتیجہ نہیں ملا۔' },
    unknown: { en: 'Unknown', ur: 'نامعلوم' },
    languageToggle: { en: 'English / اردو', ur: 'اردو / English' },
    restrictedAccess: { en: 'Restricted Access', ur: 'محدود رسائی' },
    restrictedAccessDesc: {
        en: 'You do not have permission to view this section. Please contact your administrator if you believe this is a mistake.',
        ur: 'آپ کو اس حصے کو دیکھنے کی اجازت نہیں ہے۔ اگر آپ کو لگتا ہے کہ یہ غلطی ہے تو براہ کرم اپنے منتظم سے رابطہ کریں۔',
    },
    requiredPermission: { en: 'Required permission', ur: 'مطلوبہ اجازت' },
} as const satisfies Record<string, Bilingual>;

// ── Aggregate dictionary for lookup ──────────────────────────────────

const ALL: Record<string, Bilingual> = {
    ...NAV,
    ...DASHBOARD,
    ...TAJNEED,
    ...UI,
    ...COLUMNS,
};

/**
 * Lookup a bilingual label by key.
 * Falls back to the key itself if not found (graceful degradation).
 */
export function lookup(key: string, lang: Lang): string {
    return ALL[key]?.[lang] ?? key;
}
