import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import keycloak from './keycloak'
import App from './App'
import './shared/styles/shared.css'
import './features/agcore/styles.css'
import './features/agvideo/styles.css'
import { BackgroundProvider } from './shared/contexts/BackgroundContext'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
console.log(`[App] Backend URL: ${BACKEND_URL}`)

ReactDOM.createRoot(document.getElementById('root')).render(
  <ReactKeycloakProvider
    authClient={keycloak}
    initOptions={{ checkLoginIframe: false }}
  >
    <BrowserRouter>
      <BackgroundProvider>
        <App />
      </BackgroundProvider>
    </BrowserRouter>
  </ReactKeycloakProvider>
)
