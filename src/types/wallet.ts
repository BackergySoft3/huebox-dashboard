export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'send'
  | 'receive'
  | 'withdraw'
  | 'fee'
  | 'pnl';

export type TransactionStatus = 'pending' | 'completed' | 'confirmed' | 'failed';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  coin: string;
  txId?: string;
  bybitTransferId?: string;
  externalAddress?: string;
  network?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  balance: number;
  coin: string;
}

export interface TransactionHistory {
  items: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateOrderPayload {
  amountUsd: number;
  fiat?: string;
  coin?: string;
}

export interface CreateOrderResponse {
  checkoutUrl: string;
  orderId: string;
  orderNo: string;
}

export interface WithdrawPayload {
  amount: number;
  address: string;
  network: string;
  coin?: string;
}

export interface SendPayload {
  toBybitUid: string;
  amount: number;
  coin?: string;
}
