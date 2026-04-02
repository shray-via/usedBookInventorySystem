import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ViaErrorBoundary from './ViaErrorBoundary';
import { initTelemetry } from './via-telemetry';

initTelemetry();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ViaErrorBoundary>
      <App />
    </ViaErrorBoundary>
  </React.StrictMode>
);
