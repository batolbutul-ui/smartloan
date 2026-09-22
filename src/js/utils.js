// Utility helpers: XSS Sanitization, Input Masking, and Toast Notifications

/**
 * Escapes potentially malicious HTML characters to prevent XSS attacks.
 * @param {string} str 
 * @returns {string} Safe sanitized string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format raw numbers to currency string ($15,000)
 */
export function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Format phone number as user types: (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').substring(0, 10);
  const areaCode = digits.substring(0, 3);
  const middle = digits.substring(3, 6);
  const last = digits.substring(6, 10);

  if (digits.length > 6) {
    return `(${areaCode}) ${middle}-${last}`;
  } else if (digits.length > 3) {
    return `(${areaCode}) ${middle}`;
  } else if (digits.length > 0) {
    return `(${areaCode}`;
  }
  return '';
}

/**
 * Mask National ID / SSN to preserve privacy (e.g. •••-••-4819)
 */
export function maskSensitiveId(value) {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••-••-${last4}`;
}

/**
 * Display a slick, animated fintech toast notification
 */
export function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type} animate-fade-in`;
  
  const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
