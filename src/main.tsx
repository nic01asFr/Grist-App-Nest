/**
 * Main Entry Point
 *
 * Initializes React application and mounts to DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// CRITICAL: Expose React globally for ComponentLoader
// ComponentLoader needs window.React to compile dynamic JSX from Templates table
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;

// Mount React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
