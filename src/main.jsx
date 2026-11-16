import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './state.jsx';
import App from './App.jsx';
import './styles.css';
import './styles-games.css';
import './styles-theme.css';
import './styles-areas.css';
import { applyTheme } from './lib/theme.js';
import { registerServiceWorker } from './lib/pwa.js';
import { getLang, loadLang } from './i18n/index.js';

applyTheme();
registerServiceWorker();

// Vercel also serves every version on its own long address (…-abc123-….vercel.app).
// Logins are stored per address, so always send people to the one main address.
const MAIN_HOST = 'zinapoya.vercel.app';
if (window.location.hostname.endsWith('.vercel.app') && window.location.hostname !== MAIN_HOST) {
  window.location.replace(`https://${MAIN_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

// Fetch the student's language first, so the very first screen is already translated.
loadLang(getLang()).finally(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </StrictMode>,
  );
});
