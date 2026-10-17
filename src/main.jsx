import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './state.jsx';
import App from './App.jsx';
import './styles.css';
import './styles-games.css';
import './styles-theme.css';
import { applyTheme } from './lib/theme.js';
import { registerServiceWorker } from './lib/pwa.js';

applyTheme();
registerServiceWorker();

// Vercel also serves every version on its own long address (…-abc123-….vercel.app).
// Logins are stored per address, so always send people to the one main address.
const MAIN_HOST = 'speakup-multilevel.vercel.app';
if (window.location.hostname.endsWith('.vercel.app') && window.location.hostname !== MAIN_HOST) {
  window.location.replace(`https://${MAIN_HOST}${window.location.pathname}${window.location.search}`);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
