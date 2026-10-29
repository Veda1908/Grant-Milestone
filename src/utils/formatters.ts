/**
 * Indian Rupee (INR) currency and numbering formatter
 */
export function formatRupees(amount: number): string {
  return '₹' + (amount || 0).toLocaleString('en-IN');
}
