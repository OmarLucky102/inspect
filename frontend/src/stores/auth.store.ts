import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeTokenPayload, isTokenExpired } from "@/lib/jwt";
import type { AuthTokens, TokenPayload } from "@/types/models";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: TokenPayload | null;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: TokenPayload) => void;
  logout: () => void;
  checkSession: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (tokens) => {
        const user = decodeTokenPayload(tokens.accessToken);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        });
      },

      setUser: (user) => set({ user }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null }),

      checkSession: () => {
        const token = get().accessToken;
        if (!token) return false;
        if (isTokenExpired(token)) {
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: "inspect.auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);