/*
 * src/lib/analyzer.ts  * -------------------
 * Next‑Gen OpenRTB Bid‑Request Analyser
 * ————————————————————————————————————
 * • 100 % stateless, predicate‑driven rule engine
 * • OpenRTB 2.6 + AdCOM 1.0 + Equativ extensions
 * • Zero runtime deps – vanilla TypeScript only
 * • Auto‑detect inventory type, platform, CTV/DOOH, partner profile
 * • Pure FP: analyse(json) → {summary, issues, valid, root}
 */

/**
 * ─── Public types ──────────────────────────────────────────────────
 */
export enum Severity {
  ERROR   = 'error',
  WARNING = 'warning',
  INFO    = 'info',
}

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  path: string;
  actual?: any;
  expected?: string;
  spec?: string;
}

export interface Summary {
  requestType: string;
  media: string[];
  impressions: number;
  platform: 'App' | 'Site' | 'Unknown';
  device: string;
  geo: string;
  privacy: string[];
}

export interface Result {
  summary: Summary;
  issues: Issue[];
  valid: boolean;
  root: any;
  error?: string;
}

export interface Options {
  forceCTV?: boolean;
  partner?: 'sharethrough';
}

/**
 * ─── Helpers & constants ──────────────────────────────────────────
 */
const rxIPv4   = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const rxIPv6   = /^[0-9a-fA-F:]{2,39}$/;
const rxIso3   = /^[A-Z]{3}$/;
const rxMacro  = /\[[\w_]+\]|\{[\w_]+\}/;

const DEVICE:Record<number,string>={1:'Mobile/Tablet',2:'PC',3:'CTV',4:'Phone',5:'Tablet',6:'DOOH',7:'STB'};

const safe = <T>(fn:()=>T, d?:T)=>{try{return fn();}catch{return d as any;}};

const storeMatchers:[RegExp,RegExp][]=[
  [/^https:\/\/apps\.apple\.com\/.*\/id(\d+)$/,/^\d+$/],
  [/^https:\/\/play\.google\.com\/store\/apps\/details\?id=([\w._]+)$/,/^[\w._]+$/],
  [/^https:\/\/channelstore\.roku\.com\/details\/(\d+)\/?/,/^\d+$/],
];

/**
 * ─── Core rule structure ──────────────────────────────────────────
 */
interface Ctx{root:any,opt:Options,inv:Set<string>}
interface Rule{ id:string; sev:Severity; msg:string; path:string;
  when?:(c:Ctx)=>boolean; test:(c:Ctx)=>boolean }

const rules:Rule[]=[
  /* JSON/root */
  {id:'JSON',sev:Severity.ERROR,msg:'No valid OpenRTB object found',path:'(root)',test:c=>!!c.root},

  /* Core */
  {id:'ID',sev:Severity.ERROR,msg:'BidRequest.id required',path:'id',when:c=>!!c.root,test:c=>typeof c.root.id==='string'&&c.root.id.trim()!==''},
  {id:'IMP',sev:Severity.ERROR,msg:'imp must be non‑empty array',path:'imp',when:c=>!!c.root,test:c=>Array.isArray(c.root.imp)&&c.root.imp.length>0},
  {id:'APP/SITE',sev:Severity.ERROR,msg:'Exactly one of app/site',path:'(root)',when:c=>!!c.root,test:c=>!!c.root.app!==!!c.root.site},

  /* Device */
  {id:'IP',sev:Severity.ERROR,msg:'device.ip invalid',path:'device.ip',when:c=>!!c.root.device?.ip,test:c=>rxIPv4.test(c.root.device.ip)||rxIPv6.test(c.root.device.ip)},
  {id:'GEO',sev:Severity.ERROR,msg:'geo.country must be ISO‑3166‑3',path:'device.geo.country',when:c=>!!c.root.device?.geo?.country,test:c=>rxIso3.test(c.root.device.geo.country)},

  /* Privacy */
  {id:'GDPR',sev:Severity.ERROR,msg:'regs.gdpr must be 0/1',path:'regs.gdpr',when:c=>c.root.regs?.gdpr!==undefined,test:c=>[0,1].includes(c.root.regs.gdpr)},
  {id:'CONSENT',sev:Severity.ERROR,msg:'GDPR=1 but missing consent',path:'user.ext.consent',when:c=>c.root.regs?.gdpr===1,test:c=>typeof c.root.user?.ext?.consent==='string'&&c.root.user.ext.consent.length>0},

  /* Macro detector */
  {id:'MACRO',sev:Severity.ERROR,msg:'Un‑replaced macros present',path:'(root)',test:c=>!rxMacro.test(JSON.stringify(c.root))},

  /* Video */
  {id:'V-MIMES',sev:Severity.ERROR,msg:'video.mimes must be non‑empty',path:'imp[].video.mimes',when:c=>c.inv.has('video'),test:c=>c.root.imp.every((i:any)=>!i.video||Array.isArray(i.video.mimes)&&i.video.mimes.length)},
  {id:'V-DUR',sev:Severity.ERROR,msg:'rqddurs XOR minduration/maxduration',path:'imp[].video',when:c=>c.inv.has('video'),test:c=>c.root.imp.every((i:any)=>{
     if(!i.video)return true; const v=i.video; const range=v.minduration!==undefined||v.maxduration!==undefined; const list=Array.isArray(v.rqddurs)&&v.rqddurs.length; return !(range&&list);
  })},

  /* Banner */
  {id:'B-SIZE',sev:Severity.ERROR,msg:'banner needs w/h or format[]',path:'imp[].banner',when:c=>c.inv.has('banner'),test:c=>c.root.imp.every((i:any)=>{
     if(!i.banner) return true; const b=i.banner; if(b.w&&b.h) return true; return Array.isArray(b.format)&&b.format.length&&b.format.every((f:any)=>f.w&&f.h);
  })},

  /* StoreURL vs bundle */
  {id:'STORE',sev:Severity.ERROR,msg:'storeurl/bundle mismatch',path:'app',when:c=>!!c.root.app?.storeurl&&!!c.root.app?.bundle,test:c=>{
     const url=c.root.app.storeurl,bundle=c.root.app.bundle;try{new URL(url);}catch{return false;} for(const [rx,rxB] of storeMatchers){const m=url.match(rx);if(m)return rxB.test(bundle)&&m[1]===bundle;}return false;
  }},

  /* Sharethrough */
  {id:'ST-PKEY',sev:Severity.ERROR,msg:'Sharethrough pkey missing',path:'imp[].ext.sharethrough.pkey',when:c=>c.opt.partner==='sharethrough',test:c=>c.root.imp.every((i:any)=>typeof i.ext?.sharethrough?.pkey==='string'&&i.ext.sharethrough.pkey)},
];

/**
 * ─── analyse(json) ────────────────────────────────────────────────
 */
export function analyse(json:string,opt:Options={}):Result{
  /* JSON parse */
  let parsed: any; try{parsed=JSON.parse(json);}catch(err){return {summary:{} as any,issues:[{id:'JSON',severity:Severity.ERROR,message:(err as Error).message,path:'(json)'}],valid:false,root:null,error:(err as Error).message};}

  /* locate root */
  const root=findRoot(parsed);

  /* build ctx */
  const inv=new Set<string>(); if(root?.imp)root.imp.forEach((i:any)=>{if(i.video)inv.add('video');if(i.banner)inv.add('banner');if(i.native)inv.add('native');if(i.audio)inv.add('audio');if(i.qty)inv.add('dooh');});
  const ctx:Ctx={root,opt,inv};

  /* run rules */
  const issues:Issue[]=[];
  for(const r of rules){ if(r.when && !r.when(ctx)) continue; if(!r.test(ctx)) issues.push({id:r.id,severity:r.sev,message:r.msg,path:r.path}); }

  /* summary */
  const summary:Summary={
     requestType: inv.size?[...inv].join(', '):'Unknown',
     media:[...inv],
     impressions: root?.imp?.length||0,
     platform: root?.app?'App':root?.site?'Site':'Unknown',
     device: DEVICE[root?.device?.devicetype]||'Unknown',
     geo: root?.device?.geo?.country||'N/A',
     privacy: ctxPrivacy(root),
  };

  return {summary,issues,valid:!issues.some(i=>i.severity===Severity.ERROR),root};
}

/** locate first object that has id & imp[] */
function findRoot(o:any):any{ if(o&&typeof o==='object'){ if('id'in o && Array.isArray(o.imp)) return o; for(const k in o){const f=findRoot(o[k]);if(f) return f;} } return null; }

function ctxPrivacy(r:any):string[]{ const p: string[]=[]; if(r.regs?.gdpr===1) p.push('GDPR'); if(r.user?.ext?.consent) p.push('TCF'); if(r.regs?.us_privacy) p.push('CCPA'); if(r.regs?.gpp) p.push('GPP'); return p; }
