export const Currency = {
  USD: 'usd',
  EUR: 'eur',
  GBP: 'gbp',
  INR: 'inr',
  AED: 'aed',
} as const;

export type Currency = typeof Currency[keyof typeof Currency];
