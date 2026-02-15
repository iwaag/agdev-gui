import keycloak from "../keycloak";

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});

  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
      if (keycloak.token) {
        headers.set("Authorization", `Bearer ${keycloak.token}`);
      }
    } catch (error) {
      console.warn("Failed to refresh token:", error);
    }
  }

  return fetch(input, { ...init, headers });
}
