import keycloak from "../keycloak";

export async function getAccessToken() {
  if (!keycloak.authenticated) {
    return null;
  }

  try {
    await keycloak.updateToken(30);
    return keycloak.token ?? null;
  } catch (error) {
    console.warn("Failed to refresh token:", error);
    return null;
  }
}

export async function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});

  const token = await getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
