// Motor de IA. Por defecto corre DENTRO del navegador con WebLLM (WebGPU): sin servidor, sin app, gratis.
// Si abres el sitio con ?server=https://... usa Ollama en tu PC; con ?server=off vuelve al modo navegador.
const WEBLLM="https://esm.run/@mlc-ai/web-llm@0.2.86";
const qs=new URLSearchParams(location.search).get("server");
if(qs)try{qs==="off"?localStorage.removeItem("lumora_ollama"):localStorage.setItem("lumora_ollama",qs.replace(/\/$/,""));}catch{}
const OLLAMA=localStorage.getItem("lumora_ollama");
// Modelos pro-coder (memoria aproximada en GPU). Si uno no entra, baja al siguiente y avisa.
const B05="Pro2.5-Coder-0.5B-Instruct",B15="Pro2.5-Coder-1.5B-Instruct",B7="Pro2.5-Coder-7B-Instruct",B9="Pro3.5-9B";
const NAME={[B05]:"pro-coder1",[B15]:"pro-coder2",[B7]:"pro-coder3",[B9]:"pro-coder4"};
const MODELS={"pro-coder1":[B05],"pro-coder2":[B15,B05],"pro-coder3":[B7,B15,B05],"pro-coder4":[B9,B15,B05]};
const OLD={ligero:"pro-coder1",equilibrado:"pro-coder2",potente:"pro-coder3",maximo:"pro-coder4"};
export const getNivel=()=>{const n=localStorage.getItem("lumora_nivel");return MODELS[n]?n:OLD[n]||"pro-coder2";};
export const setNivel=n=>{try{localStorage.setItem("lumora_nivel",n);}catch{}};
let eng=null,mode="web",create=null,loadedId=null,loadedName=null;

export async function pick(onProgress=()=>{}){
 if(OLLAMA){mode="ollama";
  const d=await (await fetch(OLLAMA+"/api/tags")).json(),n=(d.models||[]).map(m=>m.name);
  return n.find(x=>/^(pro-coder|lumora)/.test(x))||n.find(x=>/coder/.test(x))||n[0]||null;}
 if(!navigator.gpu)throw new Error("Tu navegador no tiene WebGPU. Usa Chrome, Edge u Opera actualizados.");
 const ad=await navigator.gpu.requestAdapter();
 if(!ad)throw new Error("No se encontró una GPU compatible con WebGPU.");
 const q=ad.features.has("shader-f16")?"q4f16_1":"q4f32_1";
 const {CreateMLCEngine}=await import(WEBLLM);
 let last;
 for(const base of MODELS[getNivel()]){
  const id=`${base}-${q}-MLC`,size=NAME[base];
  try{
   create=CreateMLCEngine;loadedId=id;loadedName=NAME[base];eng=await CreateMLCEngine(id,{initProgressCallback:p=>onProgress(`Cargando ${size}… ${Math.round((p.progress||0)*100)}%`)});
   return NAME[base];
  }catch(e){last=e;}
 }
 throw new Error("No pude cargar el modelo en tu GPU: "+(last&&last.message||last));
}

export async function stream(model,messages,onTok,signal,onStatus=()=>{}){
 if(mode==="web"){
  signal&&signal.addEventListener("abort",()=>eng&&eng.interruptGenerate());
  let got=false;
  const run=async()=>{
   const chunks=await eng.chat.completions.create({messages,stream:true,temperature:0.3,top_p:0.9,max_tokens:getNivel()==="pro-coder4"?1800:1200});
   for await(const c of chunks){const t=c.choices[0]&&c.choices[0].delta&&c.choices[0].delta.content;if(t){got=true;onTok(t);}}
  };
  try{await run();}
  catch(e){
   // El navegador a veces descarga el modelo de la GPU (inactividad, memoria). Se recarga solo y se reintenta.
   if(got||!create||!/not loaded|device|lost|reload/i.test(String(e&&e.message)))throw e;
   eng=await create(loadedId,{initProgressCallback:p=>onStatus(`Recargando modelo… ${Math.round((p.progress||0)*100)}%`)});
   onStatus(loadedName);await run();
  }
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
