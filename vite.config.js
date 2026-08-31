import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const assessors = [
  {code:'A73614',name:'Bruno Bruel',squad:'Alavancados',color:'#2563eb'},{code:'A26347',name:'Guilherme Monticelli',squad:'Alavancados',color:'#2563eb'},{code:'A38636',name:'Hellen Carvalho',squad:'Alavancados',color:'#2563eb'},{code:'A38548',name:'Igor Bairros',squad:'Alavancados',color:'#2563eb'},{code:'A96379',name:'Leonardo Vacca',squad:'Alavancados',color:'#2563eb'},{code:'A51532',name:'Nicolas Mallmann',squad:'Alavancados',color:'#2563eb'},{code:'A26305',name:'Pedro Couto',squad:'Alavancados',color:'#2563eb'},{code:'A27267',name:'Rodrigo Lisboa',squad:'Alavancados',color:'#2563eb'},{code:'A27321',name:'Vitória Vidor',squad:'Alavancados',color:'#2563eb'},{code:'A42881',name:'Ygor Walter',squad:'Alavancados',color:'#2563eb'},
  {code:'A1607',name:'Assessoria Eurostock',squad:'Los Hermanos',color:'#92400e'},{code:'A98897',name:'Daniel Mendonça',squad:'Los Hermanos',color:'#92400e'},{code:'A73851',name:'Eduardo Freitas',squad:'Los Hermanos',color:'#92400e'},{code:'A26969',name:'Eurostock Digital',squad:'Los Hermanos',color:'#92400e'},{code:'A3744',name:'Guilherme Vitt',squad:'Los Hermanos',color:'#92400e'},{code:'A98943',name:'Israel Gusso',squad:'Los Hermanos',color:'#92400e'},{code:'A97096',name:'Júlia Mendonça',squad:'Los Hermanos',color:'#92400e'},
  {code:'A39869',name:'Fernando Parisotto',squad:'Advisors',color:'#6d28d9'},{code:'A20680',name:'Francisco Dall Agnol',squad:'Advisors',color:'#6d28d9'},{code:'A50655',name:'Paulo Bortolini',squad:'Advisors',color:'#6d28d9'},
  {code:'A1998',name:'Icaro Piacini',squad:'Outliers',color:'#b45309'},{code:'A42105',name:'Joceane Lenhart',squad:'Outliers',color:'#b45309'},{code:'A59147',name:'Lucas Bach',squad:'Outliers',color:'#b45309'},{code:'A47707',name:'Mateus Brandão',squad:'Outliers',color:'#b45309'},
  {code:'A56902',name:'Daniel Mastalir',squad:'Anywhere',color:'#065f46'},{code:'A56903',name:'Leonardo Dutra',squad:'Anywhere',color:'#065f46'},
  {code:'A54287',name:'Bruno Giacomuzzi',squad:'Operacionais',color:'#374151'},{code:'A22616',name:'Enzo Hejazi',squad:'Operacionais',color:'#374151'},{code:'A61852',name:'Gabriel Berté',squad:'Operacionais',color:'#374151'},{code:'A22038',name:'José Colling',squad:'Operacionais',color:'#374151'},{code:'A20557',name:'Milena Portela',squad:'Operacionais',color:'#374151'},{code:'A33788',name:'Nicolas Gotz',squad:'Operacionais',color:'#374151'},
];

function officialAssessorsPlugin(){
  return {
    name:'official-assessors',
    enforce:'pre',
    transform(code,id){
      if(!id.endsWith('/src/App.jsx')&&!id.endsWith('\\src\\App.jsx')) return null;
      const replacement = `let ASSESSORS = ${JSON.stringify(assessors)};\nif (typeof window !== 'undefined') {\n  fetch('/api/assessors').then(r=>r.ok?r.json():null).then(d=>{ if(Array.isArray(d?.assessors)&&d.assessors.length){ ASSESSORS = d.assessors; window.dispatchEvent(new CustomEvent('insurance:assessors-updated',{detail:d.assessors})); } }).catch(()=>{});\n}`;
      const transformed = code.replace(/const ASSESSORS = \[[\s\S]*?\n\];/,replacement);
      return transformed===code?null:{code:transformed,map:null};
    }
  };
}

export default defineConfig({
  plugins:[officialAssessorsPlugin(),react()],
  build:{outDir:'dist'},
});
