import { store } from './store.js';
import { calculateLoan, calculateDti, evaluateAffordability, LOAN_TYPES } from './calculator.js';
import { escapeHtml, formatPhoneNumber, maskSensitiveId, showToast } from './utils.js';

export function initWizard({ onCompleted }) {
  let currentStep = 1;
  const totalSteps = 4;
  let uploadedFiles = [];

  // DOM Elements
  const form = document.getElementById('loan-application-form');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const submitBtn = document.getElementById('wizard-submit-btn');
  const progressFill = document.getElementById('stepper-progress-fill');
  const stepNodes = document.querySelectorAll('.step-node');
  const stepContents = document.querySelectorAll('.step-content');
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('document-upload-input');
  const fileList = document.getElementById('uploaded-files-list');

  // Input formatting listeners
  const phoneInput = document.getElementById('wiz-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      e.target.value = formatPhoneNumber(e.target.value);
    });
  }

  const ssnInput = document.getElementById('wiz-id-num');
  if (ssnInput) {
    ssnInput.addEventListener('blur', (e) => {
      if (e.target.value) e.target.value = maskSensitiveId(e.target.value);
    });
  }

  loadInitialData();

  function updateStepperUI() {
    stepNodes.forEach((node, idx) => {
      const stepNum = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        node.classList.add('active');
      } else if (stepNum < currentStep) {
        node.classList.add('completed');
      }
    });

    stepContents.forEach((content, idx) => {
      content.classList.toggle('active', idx + 1 === currentStep);
    });

    const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

    if (currentStep === 4) {
      renderReviewSummary();
    }

    const wizSection = document.getElementById('wizard-section');
    if (wizSection) {
      window.scrollTo({ top: wizSection.offsetTop - 60, behavior: 'smooth' });
    }
  }

  function validateCurrentStep() {
    let isValid = true;
    const currentStepContainer = document.querySelector(`.step-content[data-step="${currentStep}"]`);
    if (!currentStepContainer) return true;

    const requiredInputs = currentStepContainer.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
      const formGroup = input.closest('.form-group') || input.parentElement;
      let errorElement = formGroup.querySelector('.error-text');

      if (!input.value.trim() || (input.type === 'checkbox' && !input.checked)) {
        isValid = false;
        input.classList.add('error');
        if (!errorElement) {
          errorElement = document.createElement('span');
          errorElement.className = 'error-text';
          errorElement.textContent = input.dataset.errorMsg || 'This field is required';
          formGroup.appendChild(errorElement);
        }
      } else {
        input.classList.remove('error');
        if (errorElement) errorElement.remove();
      }
    });

    if (currentStep === 1) {
      const emailInput = document.getElementById('wiz-email');
      if (emailInput && emailInput.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
        isValid = false;
        emailInput.classList.add('error');
      }
    }

    return isValid;
  }

  function renderReviewSummary() {
    const amount = parseFloat(document.getElementById('wiz-amount').value) || 15000;
    const tenure = parseInt(document.getElementById('wiz-tenure').value, 10) || 24;
    const loanTypeKey = document.getElementById('wiz-type').value || 'personal';
    const rate = LOAN_TYPES[loanTypeKey]?.rate || 8.5;
    const calc = calculateLoan(amount, rate, tenure);

    const income = parseFloat(document.getElementById('wiz-income').value) || 0;
    const debt = parseFloat(document.getElementById('wiz-debt').value) || 0;
    const totalMonthlyCommitment = debt + calc.monthlyPayment;
    const dti = calculateDti(totalMonthlyCommitment, income);
    const afford = evaluateAffordability(dti);

    const rawFullName = document.getElementById('wiz-fullname').value || 'Applicant';

    document.getElementById('rev-loan-amount').textContent = `$${amount.toLocaleString()}`;
    document.getElementById('rev-loan-tenure').textContent = `${tenure} Months`;
    document.getElementById('rev-loan-rate').textContent = `${rate}% APR`;
    document.getElementById('rev-monthly-payment').textContent = `$${calc.monthlyPayment.toFixed(2)}`;
    document.getElementById('rev-total-repayment').textContent = `$${calc.totalPayment.toFixed(2)}`;
    document.getElementById('rev-name').textContent = rawFullName;
    document.getElementById('rev-income').textContent = `$${income.toLocaleString()}/mo`;

    const dtiTag = document.getElementById('rev-dti-badge');
    if (dtiTag) {
      dtiTag.className = `badge ${afford.badgeClass}`;
      dtiTag.textContent = `${dti}% (${afford.label})`;
    }
    const dtiDesc = document.getElementById('rev-dti-desc');
    if (dtiDesc) dtiDesc.textContent = afford.desc;
  }

  function handleFileUpload(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        showToast('File exceeds 10MB limit', 'warning');
        continue;
      }
      uploadedFiles.push({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'Document'
      });
    }
    showToast(`${files.length} document(s) added`, 'success');
    renderUploadedFiles();
  }

  function renderUploadedFiles() {
    if (!fileList) return;
    if (uploadedFiles.length === 0) {
      fileList.innerHTML = '';
      return;
    }
    fileList.innerHTML = uploadedFiles.map((f, idx) => `
      <div class="uploaded-file-item animate-fade-in">
        <div class="file-info">
          <span>📄</span>
          <div>
            <div class="file-name">${escapeHtml(f.name)}</div>
            <div class="file-size">${escapeHtml(f.size)} • Encrypted Upload</div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-secondary remove-file-btn" data-index="${idx}">✕</button>
      </div>
    `).join('');

    fileList.querySelectorAll('.remove-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        uploadedFiles.splice(idx, 1);
        renderUploadedFiles();
      });
    });
  }

  function loadInitialData() {
    const draft = store.getDraft();
    if (draft) {
      Object.keys(draft).forEach(key => {
        const el = document.getElementById(key);
        if (el && el.type !== 'checkbox') el.value = draft[key];
      });
    }
  }

  function saveCurrentDraft() {
    const draft = {
      'wiz-amount': document.getElementById('wiz-amount')?.value,
      'wiz-tenure': document.getElementById('wiz-tenure')?.value,
      'wiz-type': document.getElementById('wiz-type')?.value,
      'wiz-fullname': document.getElementById('wiz-fullname')?.value,
      'wiz-email': document.getElementById('wiz-email')?.value,
      'wiz-phone': document.getElementById('wiz-phone')?.value,
      'wiz-dob': document.getElementById('wiz-dob')?.value,
      'wiz-address': document.getElementById('wiz-address')?.value,
      'wiz-emp-status': document.getElementById('wiz-emp-status')?.value,
      'wiz-employer': document.getElementById('wiz-employer')?.value,
      'wiz-income': document.getElementById('wiz-income')?.value,
      'wiz-debt': document.getElementById('wiz-debt')?.value,
      'wiz-purpose': document.getElementById('wiz-purpose')?.value,
      'wiz-bank-name': document.getElementById('wiz-bank-name')?.value
    };
    store.saveDraft(draft);
  }

  // Event Listeners
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        saveCurrentDraft();
        showToast(`Step ${currentStep} verified`, 'success', 2000);
        currentStep = Math.min(currentStep + 1, totalSteps);
        updateStepperUI();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentStep = Math.max(currentStep - 1, 1);
      updateStepperUI();
    });
  }

  stepNodes.forEach((node, idx) => {
    node.addEventListener('click', () => {
      const targetStep = idx + 1;
      if (targetStep < currentStep) {
        currentStep = targetStep;
        updateStepperUI();
      } else if (targetStep === currentStep + 1 && validateCurrentStep()) {
        currentStep = targetStep;
        updateStepperUI();
      }
    });
  });

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files) handleFileUpload(e.target.files);
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateCurrentStep()) return;

      const amount = parseFloat(document.getElementById('wiz-amount').value) || 15000;
      const tenure = parseInt(document.getElementById('wiz-tenure').value, 10) || 24;
      const loanTypeKey = document.getElementById('wiz-type').value || 'personal';
      const rate = LOAN_TYPES[loanTypeKey]?.rate || 8.5;
      const calc = calculateLoan(amount, rate, tenure);

      const income = parseFloat(document.getElementById('wiz-income').value) || 5000;
      const debt = parseFloat(document.getElementById('wiz-debt').value) || 0;
      const dti = calculateDti(debt + calc.monthlyPayment, income);

      const accountNum = document.getElementById('wiz-account-num').value || '1234';
      const maskedAccount = `•••• ${accountNum.slice(-4)}`;

      const newApp = store.saveApplication({
        amount,
        tenure,
        type: loanTypeKey,
        interestRate: rate,
        monthlyPayment: calc.monthlyPayment,
        totalPayment: calc.totalPayment,
        fullName: document.getElementById('wiz-fullname').value,
        email: document.getElementById('wiz-email').value,
        phone: document.getElementById('wiz-phone').value,
        dtiRatio: dti,
        purpose: document.getElementById('wiz-purpose').value || 'Personal',
        bankName: document.getElementById('wiz-bank-name').value || 'Commercial Bank',
        accountNumberMasked: maskedAccount,
        uploadedFilesCount: uploadedFiles.length
      });

      showToast('Application successfully encrypted and submitted!', 'success');
      showSuccessScreen(newApp);
      if (onCompleted) onCompleted(newApp);
    });
  }

  function showSuccessScreen(app) {
    const wizardCard = document.querySelector('.wizard-card');
    const stepperWrapper = document.querySelector('.stepper-wrapper');
    if (stepperWrapper) stepperWrapper.style.display = 'none';

    const safeName = escapeHtml(app.fullName);
    const safeId = escapeHtml(app.id);

    wizardCard.innerHTML = `
      <div class="submission-success-card animate-fade-in">
        <div class="success-icon-badge">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Application Submitted Successfully</h2>
        <p style="max-width: 500px; margin: 0.75rem auto 1.5rem;">
          Thank you, <strong>${safeName}</strong>. Your loan application has been assigned to our automated underwriting system.
        </p>

        <div class="ref-code-display" style="cursor: pointer;" id="copy-ref-box" title="Click to Copy Reference ID">
          <span>Reference ID:</span>
          <strong>${safeId}</strong>
          <span style="font-size: 0.85rem; color: var(--primary-light); margin-left: 0.5rem; display: inline-flex; align-items: center; gap: 0.25rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copy ID
          </span>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; max-width: 480px; margin: 0 auto 2rem; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-muted);">Requested Principal:</span>
            <strong>$${app.amount.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-muted);">Repayment Term:</span>
            <strong>${app.tenure} Months</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Estimated Monthly Payment:</span>
            <strong style="color: var(--primary-light);">$${app.monthlyPayment.toFixed(2)}/mo</strong>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button id="success-track-btn" class="btn btn-primary" data-app-id="${safeId}">
            Track in Application Portal →
          </button>
          <button id="success-new-app-btn" class="btn btn-secondary">
            Start Another Application
          </button>
        </div>
      </div>
    `;

    document.getElementById('copy-ref-box')?.addEventListener('click', () => {
      navigator.clipboard.writeText(app.id).then(() => {
        showToast(`Copied ${app.id} to clipboard`, 'success');
      }).catch(() => {
        showToast(`Reference ID: ${app.id}`, 'info');
      });
    });

    document.getElementById('success-track-btn')?.addEventListener('click', () => {
      window.location.hash = '#dashboard';
      window.dispatchEvent(new CustomEvent('track-loan', { detail: { id: app.id } }));
    });

    document.getElementById('success-new-app-btn')?.addEventListener('click', () => {
      window.location.hash = '#apply';
      window.location.reload();
    });
  }

  window.addEventListener('apply-preset', (e) => {
    const { amount, tenure, type } = e.detail;
    if (document.getElementById('wiz-amount')) document.getElementById('wiz-amount').value = amount;
    if (document.getElementById('wiz-tenure')) document.getElementById('wiz-tenure').value = tenure;
    if (document.getElementById('wiz-type')) document.getElementById('wiz-type').value = type;
  });

  updateStepperUI();
}
