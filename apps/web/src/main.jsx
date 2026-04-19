/**
 * Punto de entrada del frontend React.
 *
 * CORRECCIONES:
 * 1. DEPENDENCIA - Se agrega HelmetProvider de react-helmet-async
 *    (necesario para que los componentes Helmet funcionen en React 18).
 * 2. MEJORA - StrictMode habilitado en desarrollo para detectar efectos dobles.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
