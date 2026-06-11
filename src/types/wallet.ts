// Re-exports for backwards compatibility. Import directly from src/interfaces/wallet or src/enums/ instead.
export { TransactionType } from "../enums/TransactionType.enum";
export { TransactionStatus } from "../enums/TransactionStatus.enum";
export type {
  Transaction,
  WalletBalance,
  TransactionHistory,
  CreateOrderRequest,
  CreateOrderResponse,
  WithdrawRequest,
  SendRequest,
  WithdrawResponse,
  SendResponse,
} from "../interfaces/wallet";
