import { useEffect } from "react";
import { auth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth.store";

export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // Sync OIDC storage → our store on every page load
    auth
      .getUser()
      .then((user) => {
        if (user && !user.expired) {
          setUser(
            {
              sub: user.profile.sub,
              preferred_username: user.profile.preferred_username ?? user.profile.sub,
              email: user.profile.email,
            },
            user.access_token,
          );
        }
      })
      .catch((err: unknown) => {
        console.error("[auth] Falha ao restaurar sessão:", err);
      });

    // Keep store in sync when oidc-client-ts silently renews the token
    const cleanup = auth.onUserLoaded((user) => {
      setUser(
        {
          sub: user.profile.sub,
          preferred_username: user.profile.preferred_username ?? user.profile.sub,
          email: user.profile.email,
        },
        user.access_token,
      );
    });

    return cleanup;
  }, [setUser]);
}
