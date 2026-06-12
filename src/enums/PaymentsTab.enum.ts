export const PaymentsTab = {
  Overview:    "overview",
  AddFunds:    "add-funds",
  Withdraw:    "withdraw",
  SendReceive: "send-receive",
} as const;

export type PaymentsTab = typeof PaymentsTab[keyof typeof PaymentsTab];
