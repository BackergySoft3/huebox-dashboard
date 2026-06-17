export const BybitAccountType = {
  UNIFIED: 'UNIFIED',
  FUND: 'FUND',
  CONTRACT: 'CONTRACT',
  SPOT: 'SPOT',
  OPTION: 'OPTION',
  INVESTMENT: 'INVESTMENT',
} as const;

export type BybitAccountType = typeof BybitAccountType[keyof typeof BybitAccountType];
