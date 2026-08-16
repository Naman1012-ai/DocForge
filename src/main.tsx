import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/document.css'
import './styles/print.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa/registerServiceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize PWA Service Worker in production
registerServiceWorker()
