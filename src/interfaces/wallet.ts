import { TransactionType } from "../Enums/TransactionType.enum";
import { TransactionStatus } from "../Enums/TransactionStatus.enum";

export { TransactionType, TransactionStatus };

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amountUsdt: number;
  status: TransactionStatus;
  coin: string;
  txId: string | null;
  bybitTransferId: string | null;
  externalAddress: string | null;
  network: string | null;
  metadata: Record<string, unknown>;
  errorMessage: string | null;
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

export interface CreateOrderRequest {
  amountUsd: number;
  fiat?: string;
  coin?: string;
}

export interface CreateOrderResponse {
  checkoutUrl: string;
  orderId: string;
  orderNo: string;
}

export interface WithdrawRequest {
  amount: number;
  address: string;
  network: string;
  coin?: string;
}

export interface SendRequest {
  toBybitUid: string;
  amount: number;
  coin?: string;
}

export interface WithdrawResponse {
  transferId: string;
  withdrawalId: string;
}

export interface SendResponse {
  transferId: string;
}
