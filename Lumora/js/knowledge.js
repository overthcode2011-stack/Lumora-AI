import {parseLua} from "./lua.js";
let K=[];
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export async function loadKnowledge(){
 try{const d=parseLua(await (await fetch("lua/knowledge.lua")).text());K=Array.isArray(d)?d:[];}catch{}
}
// Devuelve las fichas más parecidas a la pregunta (máx. 3 y ~2000 caracteres para no frenar el modelo).
export function relevant(q,max=2000){
 const t=norm(q),w=new Set(t.match(/[a-z0-9_]{2,}/g)||[]);
 const sc=K.map(e=>({e,s:String(e.tags).split("|").filter(g=>g&&w.has(g)).length})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
 let out="",n=0;
 for(const {e} of sc){if(out.length+e.text.length>max)continue;out+="\n["+e.id+"]\n"+e.text;if(++n>=3)break;}
 return out;
}
