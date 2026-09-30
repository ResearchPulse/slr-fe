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

    const firebaseResponse = await axios.post<FirebaseIdentityResponse>(
      `${FIREBASE_AUTH_EXCHANGE_URL}?key=${encodeURIComponent(FIREBASE_API_KEY)}`,
      {
        postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
        requestUri: window.location.origin,
        returnSecureToken: true,
        returnIdpCredential: false,
      },
    );

    const response = await api.post<LoginResponse>("/auth/google/login", {
      idToken: firebaseResponse.data.idToken,
    });
    return response.data;
  },
};
