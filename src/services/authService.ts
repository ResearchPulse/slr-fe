import axios from "axios";
import api from "../config/axios";
import type { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_AUTH_EXCHANGE_URL =
  import.meta.env.VITE_FIREBASE_AUTH_EXCHANGE_URL ||
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp";

interface FirebaseIdentityResponse {
  idToken: string;
}

const describeGoogleAuthError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    const reason = response?.error?.message || response?.message || error.message;
    const status = error.response?.status;
    return `${status ? `HTTP ${status}: ` : ""}${reason}`;
  }
  return error instanceof Error ? error.message : "Unknown error";
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  quickLogin: async (keyLogin: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/dev/quick-login", { keyLogin });
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },
  refresh: async (): Promise<RefreshResponse> => {
    // Use raw axios (not the `api` instance) to avoid interceptor loops
    const response = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, null,
      { withCredentials: true },
    );
    return response.data;
  },
  googleLogin: async (googleIdToken: string): Promise<LoginResponse> => {
    if (!FIREBASE_API_KEY) {
      throw new Error("Google sign-in is unavailable");
    }

    let firebaseResponse;
    try {
      firebaseResponse = await axios.post<FirebaseIdentityResponse>(
        `${FIREBASE_AUTH_EXCHANGE_URL}?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
        {
          postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
          requestUri: window.location.origin,
          returnSecureToken: true,
          returnIdpCredential: false,
        },
      );
    } catch (error) {
      throw new Error(`Google-to-Firebase exchange failed: ${describeGoogleAuthError(error)}`);
    }

    if (!firebaseResponse.data.idToken) {
      throw new Error("Google-to-Firebase exchange returned no Firebase ID token");
    }

    try {
      const response = await api.post<LoginResponse>("/auth/google/login", {
        idToken: firebaseResponse.data.idToken,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Backend Firebase-token verification failed: ${describeGoogleAuthError(error)}`);
    }
  },
};
