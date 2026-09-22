import { store } from './store.js';
import { escapeHtml, showToast } from './utils.js';

export function initDashboard() {
  const container = document.getElementById('dashboard-applications-container');
  const searchInput = document.getElementById('dashboard-search-input');
  const searchBtn = document.getElementById('dashboard-search-btn');
  const riskSidebar = document.getElementById('dashboard-risk-sidebar');

  function renderApplications(filterId = null) {
    const apps = store.getApplications();
    const displayApps = filterId ? apps.filter(a => a.id.toLowerCase().includes(filterId.toLowerCase())) : apps;

    if (!container) return;

    if (displayApps.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box animate-fade-in">
          <div class="empty-icon">🔍</div>
          <h3>No applications found</h3>
          <p style="margin: 0.5rem 0 1.5rem;">We couldn't find any loan application matching "${escapeHtml(filterId || '')}".</p>
          <button class="btn btn-outline" id="clear-search-btn">View All Applications</button>
        </div>
      `;
      document.getElementById('clear-search-btn')?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        renderApplications();
      });
      if (riskSidebar) riskSidebar.style.display = 'none';
      return;
    }

    if (riskSidebar) riskSidebar.style.display = 'block';

    container.innerHTML = displayApps.map(app => renderLoanCard(app)).join('');

    // Update risk sidebar with top selected application
    renderRiskGauge(displayApps[0]);

    // Download summary event listeners
    container.querySelectorAll('.download-summary-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const app = store.getApplicationById(id);
        if (app) {
          downloadSummaryMock(app);
          showToast(`Summary downloaded for ${id}`, 'success');
        }
      });
    });

    // Copy reference ID listener
    container.querySelectorAll('.loan-id-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const text = e.currentTarget.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
          showToast(`Copied ${text} to clipboard`, 'success');
        }).catch(() => {
          showToast(`Application ID: ${text}`, 'info');
        });
      });
    });
  }

  function renderLoanCard(app) {
    const stages = [
      { key: 'submitted', label: '1. Received', time: 'Completed' },
      { key: 'underwriting', label: '2. Underwriting', time: app.status === 'submitted' ? 'Pending' : 'In Progress' },
      { key: 'review', label: '3. Compliance', time: ['review', 'approved'].includes(app.status) ? 'In Progress' : 'Queued' },
      { key: 'approved', label: '4. Disbursed', time: app.status === 'approved' ? 'Active' : 'Awaiting Final Step' }
    ];

    const stageIndex = {
      'submitted': 0,
      'underwriting': 1,
      'review': 2,
      'approved': 3
    }[app.status] || 1;

    const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const safeId = escapeHtml(app.id);
    const safeName = escapeHtml(app.fullName);
    const safeBank = escapeHtml(app.bankName || 'Verified Account');
    const safeAccount = escapeHtml(app.accountNumberMasked || '•••• 8821');
    const safeType = escapeHtml((app.type || 'personal').toUpperCase());

    return `
      <div class="loan-card-item animate-fade-in" data-id="${safeId}">
        <div class="loan-card-top">
          <div>
            <span class="loan-id-badge" title="Click to copy ID" style="cursor: pointer;">${safeId} 📋</span>
            <div class="loan-amount-headline">$${app.amount.toLocaleString()}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${safeType} LOAN • Applied on ${formattedDate}
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge ${app.status === 'approved' ? 'badge-success' : 'badge-info'}">
              ${escapeHtml(app.status.toUpperCase())}
            </span>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--primary-light); margin-top: 0.5rem;">
              $${app.monthlyPayment.toFixed(2)}/mo
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${app.tenure} Months @ ${app.interestRate}% APR</div>
          </div>
        </div>

        <div class="timeline-stepper">
          ${stages.map((stage, idx) => {
            let statusClass = '';
            if (idx < stageIndex) statusClass = 'completed';
            else if (idx === stageIndex) statusClass = 'active';

            return `
              <div class="timeline-step ${statusClass}">
                <div class="timeline-step-title">${stage.label}</div>
                <div class="timeline-step-time">${idx <= stageIndex ? '✓ ' + stage.time : stage.time}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem; margin-top: 1.25rem; font-size: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
          <div style="color: var(--text-secondary);">
            Applicant: <strong>${safeName}</strong> &nbsp;|&nbsp; Disbursement: <strong>${safeBank} (${safeAccount})</strong>
          </div>
          <button class="btn btn-sm btn-secondary download-summary-btn" data-id="${safeId}">
            Download PDF Summary
          </button>
        </div>
      </div>
    `;
  }

  function renderRiskGauge(app) {
    if (!riskSidebar || !app) return;

    const score = app.creditScore || 750;
    const percentage = Math.min(Math.max((score - 300) / 550, 0), 1);
    const strokeDash = Math.round(percentage * 440);

    let tierLabel = 'Prime Excellent';
    let tierColor = 'var(--primary-light)';
    if (score < 620) {
      tierLabel = 'Subprime Risk';
      tierColor = 'var(--danger)';
    } else if (score < 700) {
      tierLabel = 'Near Prime';
      tierColor = 'var(--warning)';
    }

    riskSidebar.innerHTML = `
      <div class="risk-gauge-card animate-fade-in">
        <span class="section-tag" style="margin-bottom: 0.25rem;">AI Underwriting Score</span>
        <h3 style="font-size: 1.3rem;">Credit Eligibility</h3>
        
        <div class="risk-circle-wrapper">
          <svg class="risk-circle-svg" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" stroke="#1E293B" stroke-width="12" fill="none" />
            <circle cx="80" cy="80" r="70" stroke="#10B981" stroke-width="12" fill="none"
              stroke-dasharray="440"
              stroke-dashoffset="${440 - strokeDash}"
              stroke-linecap="round"
              style="transition: stroke-dashoffset 1s ease-out;" />
          </svg>
          <div class="risk-score-value">${score}</div>
        </div>

        <div class="risk-tier-badge">
          <span class="badge badge-success" style="color: ${tierColor};">${tierLabel}</span>
        </div>

        <div class="risk-metrics-list">
          <div class="risk-metric-row">
            <span>Debt-to-Income (DTI):</span>
            <span>${app.dtiRatio || 24}%</span>
          </div>
          <div class="risk-metric-row">
            <span>Identity Verification:</span>
            <span style="color: var(--primary-light);">✓ AML/KYC Passed</span>
          </div>
          <div class="risk-metric-row">
            <span>Fraud Risk Model:</span>
            <span style="color: var(--primary-light);">Very Low (0.01%)</span>
          </div>
          <div class="risk-metric-row">
            <span>Approval Probability:</span>
            <span style="color: var(--primary-light);">98.4%</span>
          </div>
        </div>
      </div>
    `;
  }

  function downloadSummaryMock(app) {
    const summaryText = `==============================================
SMARTLOAN OFFICIAL LOAN APPLICATION SUMMARY
==============================================
Application Reference ID: ${app.id}
Date Generated: ${new Date().toLocaleString()}
Status: ${app.status.toUpperCase()}

APPLICANT PROFILE:
- Full Legal Name: ${app.fullName}
- Contact Email: ${app.email}
- Contact Phone: ${app.phone}

LOAN SPECIFICATIONS:
- Loan Product: ${(app.type || 'personal').toUpperCase()} LOAN
- Requested Principal: $${app.amount.toLocaleString()} USD
- Term / Tenure: ${app.tenure} Months
- Annual Percentage Rate (APR): ${app.interestRate}%
- Calculated Monthly Installment: $${app.monthlyPayment.toFixed(2)} USD
- Total Loan Repayment: $${app.totalPayment ? app.totalPayment.toFixed(2) : (app.monthlyPayment * app.tenure).toFixed(2)} USD

VERIFICATION & DISBURSEMENT:
- Designated Bank: ${app.bankName || 'Verified Commercial Bank'}
- Account Number: ${app.accountNumberMasked || '•••• 8821'}
- KYC Status: Verified via Encrypted Automated Bureau
- Security Standard: 256-bit AES / TLS 1.3 Compliance

SECURITY DISCLOSURE:
SmartLoan will NEVER ask for your banking PIN, ATM PIN, or account password.
==============================================`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartLoan_${app.id}_Official_Summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      renderApplications(searchInput.value.trim());
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') renderApplications(searchInput.value.trim());
    });
  }

  window.addEventListener('track-loan', (e) => {
    if (searchInput) searchInput.value = e.detail.id;
    renderApplications(e.detail.id);
  });

  renderApplications();
}
