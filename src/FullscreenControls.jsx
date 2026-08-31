import React, { useEffect, useState } from 'react';

export default function FullscreenControls(){
  const[fullscreen,setFullscreen]=useState(Boolean(document.fullscreenElement));
  const[tvMode,setTvMode]=useState(()=>localStorage.getItem('insurance-tv-mode')==='1');

  useEffect(()=>{
    const sync=()=>setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',sync);
    return()=>document.removeEventListener('fullscreenchange',sync);
  },[]);

  useEffect(()=>{
    document.documentElement.dataset.tvMode=tvMode?'true':'false';
    localStorage.setItem('insurance-tv-mode',tvMode?'1':'0');
  },[tvMode]);

  async function toggleFullscreen(){
    try{
      if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    }catch(error){console.error('[fullscreen]',error);}
  }

  async function toggleTV(){
    const next=!tvMode;
    setTvMode(next);
    if(next&&!document.fullscreenElement){
      try{await document.documentElement.requestFullscreen();}catch(error){console.error('[tv-mode]',error);}
    }
  }

  return <div className="global-display-controls" role="group" aria-label="Controles de exibicao">
    <button className="display-control-btn" onClick={toggleTV} aria-pressed={tvMode} title="Modo TV">{tvMode?'◉':'◌'} TV</button>
    <button className="display-control-btn" onClick={toggleFullscreen} title={fullscreen?'Sair da tela cheia':'Tela cheia'}>{fullscreen?'✕':'⛶'} {fullscreen?'Sair':'Tela cheia'}</button>
  </div>;
}
