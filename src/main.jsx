import React from 'react';
import ReactDOM from 'react-dom/client';
import CampaignDashboard from './CampaignDashboard.jsx';
import PresentationPage from './PresentationPage.jsx';
import FullscreenControls from './FullscreenControls.jsx';
import './global.css';
import './campaign-layout.css';
import './campaign-entry.css';
import './mes-do-seguro.css';
import './campaign-audit.css';
import './manager-dashboard.css';
import './presentation-page.css';

const managerPaths = ['/gestor','/painel','/login'];
const isManager = managerPaths.includes(window.location.pathname) || new URLSearchParams(window.location.search).has('gestor');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isManager ? <><CampaignDashboard /><FullscreenControls /></> : <PresentationPage />}
  </React.StrictMode>
);
