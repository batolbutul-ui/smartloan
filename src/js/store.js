// LocalStorage store with reactive state and sample data
const STORAGE_KEYS = {
  APPLICATIONS: 'smartloan_applications_v1',
  DRAFT: 'smartloan_draft_v1'
};

const SAMPLE_APPLICATIONS = [
  {
    id: 'SL-89241',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    amount: 15000,
    tenure: 24,
    type: 'personal',
    interestRate: 8.5,
    monthlyPayment: 681.93,
    totalPayment: 16366.32,
    fullName: 'Alexander Vance',
    email: 'alex.vance@example.com',
    phone: '+1 (555) 234-5678',
    status: 'review', // 'submitted', 'underwriting', 'review', 'approved'
    creditScore: 765,
    dtiRatio: 22,
    purpose: 'Debt Consolidation',
    bankName: 'First National Bank',
    accountNumberMasked: '•••• 4819'
  },
  {
    id: 'SL-64019',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    amount: 35000,
    tenure: 36,
    type: 'business',
    interestRate: 7.2,
    monthlyPayment: 1083.56,
    totalPayment: 39008.16,
    fullName: 'Elena Rostova',
    email: 'elena@vanguardtech.io',
    phone: '+1 (555) 891-2345',
    status: 'approved',
    creditScore: 810,
    dtiRatio: 18,
    purpose: 'Working Capital',
    bankName: 'Chase Commercial',
    accountNumberMasked: '•••• 9920'
  }
];

export const store = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(SAMPLE_APPLICATIONS));
    }
  },

  getApplications() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return SAMPLE_APPLICATIONS;
    }
  },

  getApplicationById(id) {
    const apps = this.getApplications();
    return apps.find(a => a.id.toLowerCase() === id.trim().toLowerCase());
  },

  saveApplication(appData) {
    const apps = this.getApplications();
    const newApp = {
      id: `SL-${Math.floor(10000 + Math.random() * 90000)}`,
      createdAt: new Date().toISOString(),
      status: 'underwriting',
      creditScore: Math.floor(710 + Math.random() * 95),
      ...appData
    };
    apps.unshift(newApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    this.clearDraft();
    return newApp;
  },

  getDraft() {
    try {
      const draft = localStorage.getItem(STORAGE_KEYS.DRAFT);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  },

  saveDraft(draftData) {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draftData));
  },

  clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }
};
