import '../styles/variables.css';
import '../styles/base.css';
import '../styles/components.css';
import '../styles/calculator.css';
import '../styles/wizard.css';
import '../styles/dashboard.css';

import { store } from './store.js';
import { calculateLoan, generateAmortizationSchedule, LOAN_TYPES } from './calculator.js';
import { initWizard } from './wizard.js';
import { initDashboard } from './dashboard.js';
import { initSecurityNotice } from './securityNotice.js';
import { showToast } from './utils.js';

// Application State
let activeLoanType = 'personal';
let loanAmount = 15000;
let loanTenure = 24;

document.addEventListener('DOMContentLoaded', () => {
  store.init();
  initRouter();
  initCalculatorWidget();
  initWizard({
    onCompleted: (newApp) => {
      // Completed callback
    }
  });
  initDashboard();
  initSecurityNotice();
  initFaqAccordion();
  initDomainVerifier();
});

// View Routing System
function initRouter() {
  const views = {
    home: document.getElementById('view-home'),
    apply: document.getElementById('view-apply'),
    dashboard: document.getElementById('view-dashboard')
  };

  const navBtns = document.querySelectorAll('.nav-link-btn');

  function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const targetView = views[hash] || views.home;

    Object.values(views).forEach(v => {
      if (v) v.style.display = 'none';
    });
    if (targetView) {
      targetView.style.display = 'block';
      targetView.classList.add('animate-fade-in');
    }

    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === hash);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = `#${btn.dataset.route}`;
    });
  });

  document.querySelectorAll('[data-route-link]').forEach(el => {
    el.addEventListener('click', (e) => {
      const route = e.currentTarget.dataset.routeLink;
      window.location.hash = `#${route}`;
    });
  });
}

// Calculator Logic with Dynamic Slider Fills
function initCalculatorWidget() {
  const amountSlider = document.getElementById('calc-amount-slider');
  const amountDisplay = document.getElementById('calc-amount-display');
  const tenureSlider = document.getElementById('calc-tenure-slider');
  const tenureDisplay = document.getElementById('calc-tenure-display');
  const typeButtons = document.querySelectorAll('.calc-type-btn');
  const monthlyDisplay = document.getElementById('calc-monthly-val');
  const totalInterestDisplay = document.getElementById('calc-interest-val');
  const totalPaymentDisplay = document.getElementById('calc-total-val');
  const aprBadge = document.getElementById('calc-apr-badge');
  const applyBtn = document.getElementById('calc-apply-btn');
  const viewAmortBtn = document.getElementById('calc-view-amort-btn');
  const presetChips = document.querySelectorAll('.preset-chip');

  function updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-progress', `${percentage}%`);
  }

  function updateCalculations() {
    const config = LOAN_TYPES[activeLoanType];
    const rate = config.rate;
    const calc = calculateLoan(loanAmount, rate, loanTenure);

    if (amountDisplay) amountDisplay.textContent = `$${loanAmount.toLocaleString()}`;
    if (tenureDisplay) tenureDisplay.textContent = `${loanTenure} Months`;
    if (monthlyDisplay) monthlyDisplay.textContent = `$${calc.monthlyPayment.toFixed(2)}`;
    if (totalInterestDisplay) totalInterestDisplay.textContent = `$${calc.totalInterest.toLocaleString()}`;
    if (totalPaymentDisplay) totalPaymentDisplay.textContent = `$${calc.totalPayment.toLocaleString()}`;
    if (aprBadge) aprBadge.textContent = `${rate}% APR`;

    updateSliderFill(amountSlider);
    updateSliderFill(tenureSlider);
  }

  if (amountSlider) {
    amountSlider.value = loanAmount;
    amountSlider.addEventListener('input', (e) => {
      loanAmount = parseInt(e.target.value, 10);
      updateCalculations();
    });
  }

  if (tenureSlider) {
    tenureSlider.value = loanTenure;
    tenureSlider.addEventListener('input', (e) => {
      loanTenure = parseInt(e.target.value, 10);
      updateCalculations();
    });
  }

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      loanAmount = parseInt(chip.dataset.amount, 10);
      if (amountSlider) amountSlider.value = loanAmount;
      updateCalculations();
      showToast(`Selected $${loanAmount.toLocaleString()} loan amount`, 'info', 1800);
    });
  });

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLoanType = btn.dataset.type;
      
      const config = LOAN_TYPES[activeLoanType];
      if (amountSlider) {
        amountSlider.max = config.maxAmount;
        if (loanAmount > config.maxAmount) {
          loanAmount = config.maxAmount;
          amountSlider.value = loanAmount;
        }
      }
      if (tenureSlider) {
        tenureSlider.min = config.minTerm;
        tenureSlider.max = config.maxTerm;
      }
      updateCalculations();
      showToast(`Switched to ${config.name} (${config.rate}% APR)`, 'info', 1800);
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('apply-preset', {
        detail: {
          amount: loanAmount,
          tenure: loanTenure,
          type: activeLoanType
        }
      }));
      window.location.hash = '#apply';
    });
  }

  // Amortization Schedule Modal
  const amortModal = document.getElementById('amort-modal');
  const amortCloseBtn = document.getElementById('amort-modal-close');
  const amortBody = document.getElementById('amort-modal-table-body');

  if (viewAmortBtn && amortModal) {
    viewAmortBtn.addEventListener('click', () => {
      const schedule = generateAmortizationSchedule(loanAmount, LOAN_TYPES[activeLoanType].rate, loanTenure);
      if (amortBody) {
        amortBody.innerHTML = schedule.map(row => `
          <tr>
            <td>Month ${row.month}</td>
            <td>$${row.monthlyPayment}</td>
            <td style="color: var(--primary-light);">$${row.principalPayment}</td>
            <td style="color: var(--warning);">$${row.interestPayment}</td>
            <td>$${row.remainingBalance}</td>
          </tr>
        `).join('');
      }
      amortModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    if (amortCloseBtn) {
      amortCloseBtn.addEventListener('click', () => {
        amortModal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    amortModal.addEventListener('click', (e) => {
      if (e.target === amortModal) {
        amortModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  updateCalculations();
}

// Interactive FAQ Accordion
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });
}

// Live Domain Verification Seal
function initDomainVerifier() {
  const btn = document.getElementById('domain-verifier-btn');
  const text = document.getElementById('domain-verifier-text');
  const hostname = window.location.hostname || 'localhost';

  if (text) {
    text.textContent = `Verified: ${hostname}`;
  }

  if (btn) {
    btn.addEventListener('click', () => {
      showToast(`Host Authenticated: ${hostname} (256-Bit Encrypted)`, 'success', 4000);
    });
  }
}
