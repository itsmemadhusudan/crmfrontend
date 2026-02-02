export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}
