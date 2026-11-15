// Motor de IA. Por defecto corre DENTRO del navegador con WebLLM (WebGPU): sin servidor, sin app, gratis.
// Si abres el sitio con ?server=https://... usa Ollama en tu PC; con ?server=off vuelve al modo navegador.
const WEBLLM="https://esm.run/@mlc-ai/web-llm@0.2.86";
const qs=new URLSearchParams(location.search).get("server");
if(qs)try{qs==="off"?localStorage.removeItem("lumora_ollama"):localStorage.setItem("lumora_ollama",qs.replace(/\/$/,""));}catch{}
const OLLAMA=localStorage.getItem("lumora_ollama");
let eng=null,mode="web";

export async function pick(onProgress=()=>{}){
 if(OLLAMA){mode="ollama";
  const d=await (await fetch(OLLAMA+"/api/tags")).json(),n=(d.models||[]).map(m=>m.name);
  return n.find(x=>/^lumora/.test(x))||n.find(x=>/coder/.test(x))||n[0]||null;}
 if(!navigator.gpu)throw new Error("Tu navegador no tiene WebGPU. Usa Chrome, Edge u Opera actualizados.");
 const ad=await navigator.gpu.requestAdapter();
 if(!ad)throw new Error("No se encontró una GPU compatible con WebGPU.");
 const q=ad.features.has("shader-f16")?"q4f16_1":"q4f32_1";
 const {CreateMLCEngine}=await import(WEBLLM);
 let last;
 for(const size of ["1.5B","0.5B"]){
  const id=`Qwen2.5-Coder-${size}-Instruct-${q}-MLC`;
  try{
   eng=await CreateMLCEngine(id,{initProgressCallback:p=>onProgress(`Cargando ${size}… ${Math.round((p.progress||0)*100)}%`)});
   return id;
  }catch(e){last=e;}
 }
 throw new Error("No pude cargar el modelo en tu GPU: "+(last&&last.message||last));
}

export async function stream(model,messages,onTok,signal){
 if(mode==="web"){
  signal&&signal.addEventListener("abort",()=>eng.interruptGenerate());
  const chunks=await eng.chat.completions.create({messages,stream:true,temperature:0.4,max_tokens:1200});
  for await(const c of chunks){const t=c.choices[0]&&c.choices[0].delta&&c.choices[0].delta.content;if(t)onTok(t);}
  return;
 }
 const r=await fetch(OLLAMA+"/api/chat",{method:"POST",signal,body:JSON.stringify({model,messages,stream:true})});
 if(!r.ok)throw new Error(await r.text());
 const rd=r.body.getReader(),dec=new TextDecoder();let buf="",th=false;
 for(;;){
  const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
  const ls=buf.split("\n");buf=ls.pop();
  for(const l of ls){if(!l.trim())continue;const j=JSON.parse(l);if(j.error)throw new Error(j.error);const m=j.message||{};
   if(m.thinking){if(!th){onTok("<think>");th=true;}onTok(m.thinking);}
   if(m.content){if(th){onTok("</think>");th=false;}onTok(m.content);}}
 }
 if(th)onTok("</think>");
}
