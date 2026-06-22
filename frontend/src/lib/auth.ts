import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";
import env from "./env";

let _manager: UserManager | null = null;

function getManager(): UserManager {
  if (!_manager) {
    _manager = new UserManager({
      authority: `${env.keycloakUrl}/realms/${env.keycloakRealm}`,
      client_id: env.keycloakClientId,
      redirect_uri: `${window.location.origin}/auth/callback`,
      post_logout_redirect_uri: `${window.location.origin}/login`,
      response_type: "code",
      scope: "openid profile email",
      pkce_method: "S256",
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({ store: localStorage }),
    });
  }
  return _manager;
}

export const auth = {
  login: () => getManager().signinRedirect(),
  logout: () => getManager().signoutRedirect(),
  handleCallback: (): Promise<User> => getManager().signinRedirectCallback(),
  getUser: (): Promise<User | null> => getManager().getUser(),
  onUserLoaded: (cb: (user: User) => void) => {
    const mgr = getManager();
    mgr.events.addUserLoaded(cb);
    return () => mgr.events.removeUserLoaded(cb);
  },
};
