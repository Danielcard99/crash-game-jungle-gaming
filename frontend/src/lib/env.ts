function getEnv(key: string, devDefault: string): string {
  const value = import.meta.env[key] as string | undefined;
  if (value) return value;
  if (import.meta.env.PROD) {
    throw new Error(`[env] ${key} é obrigatório em produção mas não foi definido.`);
  }
  return devDefault;
}

const env = {
  apiUrl: getEnv("VITE_API_URL", "http://localhost:8000"),
  wsUrl: getEnv("VITE_WS_URL", "http://localhost:4001"),
  keycloakUrl: getEnv("VITE_KEYCLOAK_URL", "http://localhost:8080"),
  keycloakRealm: getEnv("VITE_KEYCLOAK_REALM", "crash-game"),
  keycloakClientId: getEnv("VITE_KEYCLOAK_CLIENT_ID", "crash-game-client"),
};

export default env;
