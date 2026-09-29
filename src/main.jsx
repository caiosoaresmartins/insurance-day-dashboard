import React from 'react';
import ReactDOM from 'react-dom/client';
import CampaignDashboard from './CampaignDashboard.jsx';
import MesDoSeguroDashboard from './MesDoSeguroDashboard.jsx';
import FullscreenControls from './FullscreenControls.jsx';
import SeptemberCampaign from './SeptemberCampaign.jsx';
import './global.css';
import './campaign-layout.css';
import './campaign-entry.css';
import './mes-do-seguro.css';
import './campaign-audit.css';

const isThirteenthCampaign=window.location.pathname==='/13o'||new URLSearchParams(window.location.search).get('campaign')==='13o';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isThirteenthCampaign?<CampaignDashboard/>:<MesDoSeguroDashboard/>}
    <FullscreenControls />
    {!isThirteenthCampaign&&<SeptemberCampaign />}
  </React.StrictMode>
);
