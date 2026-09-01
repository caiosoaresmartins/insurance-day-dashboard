import React,{useState} from 'react';
import CampaignIntroCinematic from './CampaignIntroCinematic.jsx';

export default function SeptemberCampaign(){
  const[showIntro,setShowIntro]=useState(true);
  const enterSecureArea=()=>{setShowIntro(false);setTimeout(()=>document.querySelector('.mseg-access-card input')?.focus(),120)};
  return <>
    {showIntro&&<CampaignIntroCinematic onClose={enterSecureArea} onFollow={enterSecureArea}/>} 
    {!showIntro&&<button className="campaign-launcher" onClick={()=>setShowIntro(true)}>▶ Rever abertura</button>}
  </>;
}
