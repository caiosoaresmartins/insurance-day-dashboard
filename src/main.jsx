import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FullscreenControls from './FullscreenControls.jsx';
import IntelligencePanel from './IntelligencePanel.jsx';
import SeptemberCampaign from './SeptemberCampaign.jsx';
import './global.css';
import './campaign-layout.css';
import './campaign-entry.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <FullscreenControls />
    <IntelligencePanel />
    <SeptemberCampaign />
  </React.StrictMode>
);
