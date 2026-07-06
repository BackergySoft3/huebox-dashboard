import type { Currency } from "../Enums";
import { api } from "./http.service";

export interface PrepareAccountRequest {
  firstName: string;
  lastName: string;
  country: string;
  phone: string;
  currency: Currency;
  referralCode?: string;
  avatarUrl?: string;
}

export const authApi = {
  prepareAccount: async (data: PrepareAccountRequest): Promise<void> => {
    // Note: AUTH_ENDPOINTS doesn't have prepare-account, so using explicit path
    const response = await api.patch("/api/auth/prepare-account", data);
    return response.data;
  },
};
