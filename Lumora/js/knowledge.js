import {parseLua} from "./lua.js";
let K=[],DF={};
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export async function loadKnowledge(){
 try{
  const d=parseLua(await (await fetch("lua/knowledge.lua")).text());K=Array.isArray(d)?d:[];
  // Peso de cada palabra clave: las que salen en muchas fichas (pagina, color, error...) valen poco.
  DF={};K.forEach(e=>new Set(String(e.tags).split("|").filter(Boolean)).forEach(g=>DF[g]=(DF[g]||0)+1));
 }catch{}
}
// Devuelve como máximo 2 fichas realmente relacionadas (~1500 caracteres) para no frenar ni confundir al modelo.
export function relevant(q,max=1500){
 const w=new Set((norm(q).match(/[a-z0-9_]{2,}/g)||[]));
 const sc=K.map(e=>{const tags=new Set(String(e.tags).split("|").filter(Boolean));let s=0;tags.forEach(g=>{if(w.has(g))s+=1/(DF[g]||1);});return {e,s};})
  .filter(x=>x.s>=0.4).sort((a,b)=>b.s-a.s);
 let out="",n=0;
 for(const {e} of sc){if(out.length+e.text.length>max)continue;out+="\n["+e.id+"]\n"+e.text;if(++n>=2)break;}
 return out;
}
