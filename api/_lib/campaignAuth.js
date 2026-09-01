import crypto from 'crypto';

export const BUSINESS_TIMEZONE='America/Sao_Paulo';
export const VALID_TYPES=new Set(['R1','R2','Venda']);

export const ASSESSORS=[
  ['A73614','Bruno Bruel','Alavancados'],['A26347','Guilherme Monticelli','Alavancados'],['A38636','Hellen Carvalho','Alavancados'],['A38548','Igor Bairros','Alavancados'],['A96379','Leonardo Vacca','Alavancados'],['A51532','Nicolas Mallmann','Alavancados'],['A26305','Pedro Couto','Alavancados'],['A27267','Rodrigo Lisboa','Alavancados'],['A27321','Vitória Vidor','Alavancados'],['A42881','Ygor Walter','Alavancados'],
  ['A1607','Assessoria Eurostock','Los Hermanos'],['A98897','Daniel Mendonça','Los Hermanos'],['A73851','Eduardo Freitas','Los Hermanos'],['A26969','Eurostock Digital','Los Hermanos'],['A3744','Guilherme Vitt','Los Hermanos'],['A98943','Israel Gusso','Los Hermanos'],['A97096','Júlia Mendonça','Los Hermanos'],
  ['A39869','Fernando Parisotto','Advisors'],['A20680','Francisco Dall Agnol','Advisors'],['A50655','Paulo Bortolini','Advisors'],['A1998','Icaro Piacini','Outliers'],['A42105','Joceane Lenhart','Outliers'],['A59147','Lucas Bach','Outliers'],['A47707','Mateus Brandão','Outliers'],['A56902','Daniel Mastalir','Anywhere'],['A56903','Leonardo Dutra','Anywhere'],
  ['A54287','Bruno Giacomuzzi','Operacionais'],['A22616','Enzo Hejazi','Operacionais'],['A61852','Gabriel Berté','Operacionais'],['A22038','José Colling','Operacionais'],['A20557','Milena Portela','Operacionais'],['A33788','Nicolas Gotz','Operacionais'],
].reduce((map,[code,name,squad])=>{map[code]={code,name,squad};return map;},{});

function secret(){
  return process.env.SESSION_SECRET||process.env.ADMIN_SECRET||process.env.KV_REST_API_TOKEN||'';
}
function b64url(input){return Buffer.from(input).toString('base64url');}
function sign(raw){return crypto.createHmac('sha256',secret()).update(raw).digest('base64url');}

export function createSession(payload,hours=12){
  if(!secret())throw new Error('Session secret unavailable');
  const body={...payload,iat:Date.now(),exp:Date.now()+hours*60*60*1000};
  const raw=b64url(JSON.stringify(body));
  return `${raw}.${sign(raw)}`;
}

export function verifySession(token){
  if(!token||!secret())return null;
  const [raw,sig]=String(token).split('.');
  if(!raw||!sig)return null;
  const expected=sign(raw);
  try{
    if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
    const payload=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));
    if(!payload?.exp||payload.exp<Date.now())return null;
    if(payload.role==='advisor'&&!ASSESSORS[payload.code])return null;
    if(!['advisor','admin'].includes(payload.role))return null;
    return payload;
  }catch{return null;}
}

export function requestSession(req){
  const auth=String(req.headers.authorization||'');
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  return verifySession(token);
}

export function advisorForCode(code){return ASSESSORS[String(code||'').trim().toUpperCase()]||null;}
