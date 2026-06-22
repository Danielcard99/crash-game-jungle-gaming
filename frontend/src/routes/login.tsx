import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Entrar — RocketCrash" },
      {
        name: "description",
        content: "Autentique-se via Keycloak para apostar no RocketCrash.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleKeycloak = () => {
    setLoading(true);
    auth.login().catch((err: unknown) => {
      setLoading(false);
      toast.error("Erro ao conectar ao Keycloak", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cosmic text-foreground">
      {/* grid bg */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.82 0.19 85 / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(0.82 0.19 85 / 0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[image:var(--gradient-rocket)] shadow-glow">
            <span className="text-xl">🚀</span>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">
            ROCKET<span className="text-gradient-multiplier">CRASH</span>
          </span>
        </Link>

        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-glow">
          <h1 className="font-display text-2xl font-bold">Entrar para apostar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autenticação via Keycloak (OIDC · PKCE S256). Seu saldo e histórico estão vinculados à
            sua conta.
          </p>

          <button
            onClick={handleKeycloak}
            disabled={loading}
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[image:var(--gradient-rocket)] py-4 font-display text-base font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Conectando…
              </>
            ) : (
              <>
                <span>🔐</span>
                Continuar com Keycloak
              </>
            )}
          </button>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Realm <code className="rounded bg-muted px-1.5 py-0.5 font-mono">crash-game</code> ·
            Client{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">crash-game-client</code>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 text-xs text-muted-foreground transition hover:text-foreground"
        >
          ← Voltar ao jogo
        </Link>
      </div>
    </div>
  );
}
