const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000",
  wsUrl: (import.meta.env.VITE_WS_URL as string | undefined) ?? "http://localhost:4001",
  keycloakUrl: (import.meta.env.VITE_KEYCLOAK_URL as string | undefined) ?? "http://localhost:8080",
  keycloakRealm: (import.meta.env.VITE_KEYCLOAK_REALM as string | undefined) ?? "crash-game",
  keycloakClientId: (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined) ?? "crash-game-client",
};

export default env;
