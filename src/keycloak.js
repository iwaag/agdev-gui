import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080', // Keycloak base URL
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'myrealm', // Realm name
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'myclient', // Client ID
});

export default keycloak;
