/**
 * Formats a number as Mexican Pesos
 * Example: formatMXN(1250.5) → "$1,250.50 MXN"
 */
export function formatMXN(amount: number): string {
  return (
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(amount) + ' MXN'
  );
}

/**
 * Calculates simple interest
 */
export function calculateInterest(
  principal: number,
  annualRate: number,
  months: number
): number {
  return principal * (annualRate / 12) * months;
}

/**
 * Calculates monthly installment amount (fixed payment)
 */
export function calculateInstallment(
  principal: number,
  annualRate: number,
  months: number
): number {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / months;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}
