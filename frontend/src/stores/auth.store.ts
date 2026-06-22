import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  sub: string;
  preferred_username: string;
  email?: string;
}

interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser, token: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setUser: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),
      clear: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: "crash-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
