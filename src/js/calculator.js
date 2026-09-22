// Loan Calculator Mathematical Engine

export const LOAN_TYPES = {
  personal: { name: 'Personal Loan', rate: 8.5, maxAmount: 50000, defaultAmount: 15000, minTerm: 6, maxTerm: 60 },
  business: { name: 'Business Loan', rate: 7.2, maxAmount: 100000, defaultAmount: 40000, minTerm: 12, maxTerm: 60 },
  auto: { name: 'Auto Loan', rate: 5.9, maxAmount: 75000, defaultAmount: 25000, minTerm: 12, maxTerm: 72 },
  home: { name: 'Home Equity', rate: 6.5, maxAmount: 100000, defaultAmount: 50000, minTerm: 24, maxTerm: 120 }
};

export function calculateLoan(principal, annualRate, tenureMonths) {
  const r = (annualRate / 100) / 12; // Monthly interest rate
  const n = tenureMonths;

  let monthlyPayment = 0;
  if (r === 0) {
    monthlyPayment = principal / n;
  } else {
    monthlyPayment = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  const totalPayment = monthlyPayment * n;
  const totalInterest = totalPayment - principal;

  return {
    principal,
    annualRate,
    tenureMonths,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100
  };
}

export function generateAmortizationSchedule(principal, annualRate, tenureMonths) {
  const r = (annualRate / 100) / 12;
  const { monthlyPayment } = calculateLoan(principal, annualRate, tenureMonths);
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPayment = balance * r;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month,
      monthlyPayment: monthlyPayment.toFixed(2),
      principalPayment: principalPayment.toFixed(2),
      interestPayment: interestPayment.toFixed(2),
      remainingBalance: balance.toFixed(2)
    });
  }

  return schedule;
}

export function calculateDti(monthlyDebt, monthlyIncome) {
  if (!monthlyIncome || monthlyIncome <= 0) return 0;
  return Math.round((monthlyDebt / monthlyIncome) * 100);
}

export function evaluateAffordability(dti) {
  if (dti <= 28) return { label: 'Optimal', badgeClass: 'badge-success', desc: 'Excellent debt ratio. Fast-track eligible.' };
  if (dti <= 36) return { label: 'Good', badgeClass: 'badge-success', desc: 'Standard healthy debt-to-income profile.' };
  if (dti <= 43) return { label: 'Moderate', badgeClass: 'badge-warning', desc: 'Acceptable; may require income verification.' };
  return { label: 'High', badgeClass: 'badge-warning', desc: 'Exceeds standard limits; manual review required.' };
}
