// Documentación oficial de Roblox integrada: lee el archivo de la clase en GitHub (Roblox/creator-docs).
import {parseLua} from "./lua.js";
const RAW="https://raw.githubusercontent.com/Roblox/creator-docs/main/content/en-us/reference/engine/classes/";
const WEB="https://create.roblox.com/docs/reference/engine/classes/";
// Eventos y métodos muy usados que se nombran sin decir la clase.
const ALIAS={PlayerAdded:"Players",PlayerRemoving:"Players",GetPlayers:"Players",GetPlayerFromCharacter:"Players",CharacterAdded:"Player",LoadCharacter:"Player",Kick:"Player",Touched:"BasePart",Heartbeat:"RunService",RenderStepped:"RunService",Stepped:"RunService",FireServer:"RemoteEvent",FireClient:"RemoteEvent",FireAllClients:"RemoteEvent",OnServerEvent:"RemoteEvent",OnClientEvent:"RemoteEvent",InvokeServer:"RemoteFunction",GetAsync:"GlobalDataStore",SetAsync:"GlobalDataStore",UpdateAsync:"GlobalDataStore",WaitForChild:"Instance",FindFirstChild:"Instance",TakeDamage:"Humanoid",Raycast:"WorldRoot",GetPartBoundsInBox:"WorldRoot"};
let CLASSES=new Set(),LOWER=new Map();const cache=new Map();
export async function loadDocs(){
 try{const a=parseLua(await (await fetch("lua/classes.lua")).text());CLASSES=new Set(a);LOWER=new Map(a.filter(n=>n.length>=8).map(n=>[n.toLowerCase(),n]));}catch{}
}
export function detect(q){
 const out=[],add=n=>{if(n&&!out.includes(n))out.push(n);};
 for(const t of q.match(/\b[A-Za-z][A-Za-z0-9]{2,}\b/g)||[]){
  if(/^[A-Z]/.test(t)&&CLASSES.has(t))add(t);
  else if(LOWER.has(t.toLowerCase()))add(LOWER.get(t.toLowerCase()));
  else if(ALIAS[t])add(ALIAS[t]);
 }
 return out.slice(0,2);
}
const clean=s=>s.replace(/`Class\.[\w.:]+\(\)\|([^`]*)`/g,"$1").replace(/`Class\.([\w:.]+)(?:\|([^`]*))?`/g,(m,a,b)=>b||a.split(/[.:]/).pop()).replace(/\[([^\]]+)\]\([^)]*\)/g,"$1").replace(/`/g,"").replace(/\s+/g," ").trim();
function block(L,i,indent){const pad=" ".repeat(indent),o=[];for(;i<L.length;i++){const l=L[i];if(l.trim()===""){o.push("");continue;}if(!l.startsWith(pad))break;o.push(l.slice(indent));}return clean(o.join(" "));}
export function parse(y){
 const L=y.split("\n"),out={summary:"",inherits:[],members:[]};let sec="",cur=null,m;
 for(let i=0;i<L.length;i++){
  const ln=L[i];
  if((m=/^(\w+):\s*(.*)$/.exec(ln))){sec=m[1];cur=null;if(sec==="summary"&&m[2].startsWith("|"))out.summary=block(L,i+1,2);}
  else if(sec==="inherits"&&(m=/^  - (\S+)/.exec(ln)))out.inherits.push(m[1]);
  else if(["properties","methods","events","callbacks","functions"].includes(sec)&&(m=/^  - name: (\S+)/.exec(ln))){cur={kind:sec,name:m[1].replace(/^.*[.:]/,""),summary:"",dep:false};out.members.push(cur);}
  else if(cur&&/^    summary: \|/.test(ln))cur.summary=block(L,i+1,6);
  else if(cur&&/^    deprecation_message: '.+'/.test(ln))cur.dep=true;
 }
 return out;
}
const fmt=(c,p,q,budget)=>{
 const ws=new Set((q.match(/[A-Za-z]{3,}/g)||[]).map(w=>w.toLowerCase())),live=p.members.filter(x=>!x.dep);
 const pub=live.filter(x=>!/^[a-z]/.test(x.name)),hit=x=>ws.has(x.name.toLowerCase())?0:1;
 const names=k=>pub.filter(x=>x.kind===k).sort((a,b)=>hit(a)-hit(b)).map(x=>x.name);
 let t=`[Roblox Docs · ${c}]${p.inherits.length?" (hereda de "+p.inherits[0]+")":""} ${p.summary.slice(0,260)}`;
 const ev=names("events").slice(0,12),me=names("methods").slice(0,18),pr=names("properties").slice(0,14);
 if(ev.length)t+="\nEventos: "+ev.join(", ");if(me.length)t+="\nMétodos: "+me.join(", ");if(pr.length)t+="\nPropiedades: "+pr.join(", ");
 for(const x of pub.filter(x=>ws.has(x.name.toLowerCase())&&x.summary).slice(0,2))t+=`\nDetalle ${x.name}: ${x.summary.slice(0,230)}`;
 return t.slice(0,budget);
};
export async function robloxDocs(q,onStart){
 const names=detect(q);if(!names.length)return {text:"",sources:[]};
 onStart&&onStart(names);
 const out=[],sources=[];
 for(const [i,c] of names.entries()){
  try{
   if(!cache.has(c)){const r=await fetch(RAW+c+".yaml",{signal:AbortSignal.timeout(7000)});if(!r.ok)throw new Error(r.status);cache.set(c,parse(await r.text()));}
   out.push(fmt(c,cache.get(c),q,i?750:1100));sources.push({t:"Roblox Docs · "+c,u:WEB+c});
  }catch{}
 }
 return {text:out.join("\n\n"),sources};
}
