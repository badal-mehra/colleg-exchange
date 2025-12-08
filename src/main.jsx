import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 1. Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 2. Production Service Worker Registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((reg) => {
      
      // Detect update on load (if a waiting SW exists)
      if (reg.waiting) {
        if (window.onPwaUpdateAvailable) window.onPwaUpdateAvailable(reg);
      }

      // Detect update found during usage
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            // If new SW is installed and waiting...
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New update available');
              if (window.onPwaUpdateAvailable) window.onPwaUpdateAvailable(reg);
            }
          };
        }
      };
    });

    // 3. Handle Controller Change (Reload trigger)
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  });
}
