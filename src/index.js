import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

console.log('[React] Starting initialization...');

const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  console.log('[React] Looking for root element...', { exists: !!rootElement });
  
  if (!rootElement) {
    console.error('[React] FATAL: root element not found in DOM!');
    console.error('[React] Available elements:', document.body.innerHTML);
    throw new Error('Root element with id="root" not found in public/index.html');
  }
  
  console.log('[React] Root element found! Creating React root...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('[React] React root created successfully');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('[React] App rendered successfully');
  } catch (err) {
    console.error('[React] Error rendering app:', err);
    throw err;
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  console.log('[React] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[React] DOMContentLoaded fired');
    renderApp();
  });
} else {
  console.log('[React] DOM already loaded, rendering immediately...');
  renderApp();
}