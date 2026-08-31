import React,{useEffect,useRef,useState} from 'react';

const VIDEO_SRC='/campaigns/2026/setembro/abertura-tv.mp4';

function playOriginalSoundtrack(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return null;
  const ctx=new AudioCtx();
  const master=ctx.createGain();
  master.gain.value=.12;
  master.connect(ctx.destination);
  const start=ctx.currentTime;
  const notes=[55,82.41,110,146.83,220];
  for(let i=0;i<16;i++){
    const t=start+i*.5;
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.type=i%4===0?'sawtooth':'triangle';
    o.frequency.value=notes[i%notes.length];
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(i%4===0?.13:.055,t+.025);
    g.gain.exponentialRampToValueAtTime(.001,t+.38);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+.4);
  }
  return ctx;
}

function speakCampaign(){
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance('Setembro começou. O CEO endoidou. Três reuniões agendadas, cem reais. Uma reunião realizada, duzentos reais. Fechou uma venda? Cinquenta por cento de comissão. Agora é produção.');
  u.lang='pt-BR';u.rate=.95;u.pitch=.88;u.volume=1;
  window.speechSynthesis.speak(u);
}

export default function VideoCampaignIntro({onClose,onFallback}){
  const videoRef=useRef(null);
  const[audioOn,setAudioOn]=useState(false);
  const[failed,setFailed]=useState(false);
  const audioCtxRef=useRef(null);

  useEffect(()=>{
    const v=videoRef.current;
    if(!v)return;
    const p=v.play();
    if(p?.catch)p.catch(()=>{});
    return()=>{window.speechSynthesis?.cancel();audioCtxRef.current?.close?.().catch?.(()=>{});};
  },[]);

  function enableSound(){
    if(audioOn)return;
    setAudioOn(true);
    audioCtxRef.current=playOriginalSoundtrack();
    speakCampaign();
  }

  function fail(){
    setFailed(true);
    onFallback?.();
  }

  if(failed)return null;

  return <div className="campaign-video-intro" role="dialog" aria-modal="true" aria-label="Abertura da campanha O CEO Endoidou">
    <video ref={videoRef} src={VIDEO_SRC} autoPlay muted playsInline preload="auto" onEnded={onClose} onError={fail}/>
    <div className="campaign-video-shade"/>
    <div className="campaign-video-topbar"><span>CAMPANHA DE SETEMBRO · EUROSTOCK</span><button onClick={enableSound}>{audioOn?'🔊 SOM ATIVO':'🔇 ATIVAR SOM'}</button></div>
    <div className="campaign-video-actions"><button className="campaign-video-primary" onClick={enableSound}>{audioOn?'TRILHA ATIVA':'ATIVAR SOM'}</button><button onClick={onClose}>PULAR ABERTURA →</button></div>
  </div>;
}
