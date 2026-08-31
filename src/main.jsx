import React from 'react';
import ReactDOM from 'react-dom/client';
import CampaignDashboard from './CampaignDashboard.jsx';
import FullscreenControls from './FullscreenControls.jsx';
import IntelligencePanel from './IntelligencePanel.jsx';
import SeptemberCampaign from './SeptemberCampaign.jsx';
import './global.css';
import './campaign-layout.css';
import './campaign-entry.css';
import './mes-do-seguro.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CampaignDashboard />
    <FullscreenControls />
    <IntelligencePanel />
    <SeptemberCampaign />
  </React.StrictMode>
);
