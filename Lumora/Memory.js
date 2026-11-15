import {parseLua,toLua} from "./lua.js";
const K="lumora_memory";
const PII=[/[\w.+-]+@[\w-]+\.[\w.]+/,/(?:\+?\d[\s().-]?){8,}/,/\b\d{6,}\b/,
 /\b(?:me llamo|mi nombre es|ll[aá]mame|me dicen)\s+\S+/i,/\bsoy\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
 /\b(?:vivo en|mi direcci[oó]n|mi (?:dni|tel[eé]fono|celular|correo|email|contrase[ñn]a|cuenta|apellido))\b/i];
export const hasPII=t=>PII.some(r=>r.test(t));
let mem={version:1,facts:[]};
export async function loadMemory(){
 try{const s=localStorage.getItem(K);if(s)mem=JSON.parse(s);else mem=parseLua(await (await fetch("lua/memory.lua")).text());}catch{}
 if(!mem||!Array.isArray(mem.facts))mem={version:1,facts:[]};return mem;
}
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function learn(t){
 t=t.replace(/\s+/g," ").trim().slice(0,400);
 if(t.length<6||hasPII(t)||mem.facts.some(f=>norm(f)===norm(t)))return false;
 mem.facts.push(t);try{localStorage.setItem(K,JSON.stringify(mem));}catch{}return true;
}
export function recall(q){
 if(mem.facts.length<=12)return mem.facts;
 const w=new Set(norm(q).match(/[a-z0-9+#.]{3,}/g)||[]);
 return mem.facts.map(f=>({f,s:(norm(f).match(/[a-z0-9+#.]{3,}/g)||[]).filter(x=>w.has(x)).length})).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,8).map(x=>x.f);
}
export function exportLua(){
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["-- Memoria de Lumora AI\nreturn "+toLua(mem)+"\n"],{type:"text/plain"}));a.download="memory.lua";a.click();
}
