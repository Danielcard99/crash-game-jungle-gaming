import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth
      .handleCallback()
      .then((user) => {
        setUser(
          {
            sub: user.profile.sub,
            preferred_username:
              user.profile.preferred_username ?? user.profile.sub,
            email: user.profile.email,
          },
          user.access_token,
        );
        navigate({ to: "/" });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Authentication failed";
        console.error("OIDC callback error:", err);
        setError(message);
      });
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cosmic">
        <div className="rounded-2xl border border-danger/50 bg-card p-8 text-center">
          <p className="text-danger">Authentication error: {error}</p>
          <a
            href="/login"
            className="mt-4 block text-sm text-muted-foreground hover:text-foreground"
          >
            ← Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cosmic">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">Completing login…</p>
      </div>
    </div>
  );
}
