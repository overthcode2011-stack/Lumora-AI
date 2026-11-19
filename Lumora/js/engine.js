// Motor de IA. Por defecto corre DENTRO del navegador con WebLLM (WebGPU): sin servidor, sin app, gratis.
// Si abres el sitio con ?server=https://... usa Ollama en tu PC; con ?server=off vuelve al modo navegador.
const WEBLLM="https://esm.run/@mlc-ai/web-llm@0.2.86";
const qs=new URLSearchParams(location.search).get("server");
if(qs)try{qs==="off"?localStorage.removeItem("lumora_ollama"):localStorage.setItem("lumora_ollama",qs.replace(/\/$/,""));}catch{}
const OLLAMA=localStorage.getItem("lumora_ollama");
// IMPORTANTE: estos son los IDs REALES de WebLLM (nombres de archivo del modelo). No los renombres
// (si cambias "Qwen" por otra palabra el modelo no se encuentra). El nombre visible es pro-coder-vN.
const Q06="Qwen3-0.6B",Q17="Qwen3-1.7B",Q4="Qwen3-4B",C7="Qwen2.5-Coder-7B-Instruct";
const NAME={[Q06]:"pro-coder-v1",[Q17]:"pro-coder-v2",[Q4]:"pro-coder-v3",[C7]:"pro-coder-v4"};
// Si un modelo no entra en tu GPU, baja al siguiente y avisa.
const MODELS={"pro-coder1":[Q06],"pro-coder2":[Q17,Q06],"pro-coder3":[Q4,Q17,Q06],"pro-coder4":[C7,Q4,Q17]};
const OLD={ligero:"pro-coder1",equilibrado:"pro-coder2",potente:"pro-coder3",maximo:"pro-coder4"};
export const getNivel=()=>{const n=localStorage.getItem("lumora_nivel");return MODELS[n]?n:OLD[n]||"pro-coder2";};
export const setNivel=n=>{try{localStorage.setItem("lumora_nivel",n);}catch{}};
// Muestreo conservador: poca temperatura = respuestas estables y precisas.
const TEMP=0.15,TOP_P=0.8,REPEAT=1.08;
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

// o.long = true cuando piden código (respuesta más larga); si no, respuestas cortas = más rápidas.
export async function stream(model,messages,onTok,signal,onStatus=()=>{},o={}){
 const maxTok=o.long?1400:700;
 if(mode==="web"){
  signal&&signal.addEventListener("abort",()=>eng&&eng.interruptGenerate());
  let got=false;
  const run=async(thinkOff)=>{
   const req={messages,stream:true,temperature:TEMP,top_p:TOP_P,repetition_penalty:REPEAT,max_tokens:maxTok};
   // Qwen3 piensa por defecto (lento): se desactiva para responder directo.
   if(thinkOff&&/^Qwen3-/.test(loadedId))req.extra_body={enable_thinking:false};
   const chunks=await eng.chat.completions.create(req);
   for await(const c of chunks){const t=c.choices[0]&&c.choices[0].delta&&c.choices[0].delta.content;if(t){got=true;onTok(t);}}
  };
  try{await run(true);}
  catch(e){
   const m=String(e&&e.message);
   if(got)throw e;
   if(/enable_thinking|extra_body/i.test(m)){await run(false);return;}
   // El navegador a veces descarga el modelo de la GPU (inactividad, memoria). Se recarga solo y se reintenta.
   if(!create||!/not loaded|device|lost|reload/i.test(m))throw e;
   eng=await create(loadedId,{initProgressCallback:p=>onStatus(`Recargando modelo… ${Math.round((p.progress||0)*100)}%`)});
   onStatus(loadedName);await run(true);
  }
  return;
 }
 const r=await fetch(OLLAMA+"/api/chat",{method:"POST",signal,body:JSON.stringify({model,messages,stream:true,options:{temperature:TEMP,top_p:TOP_P,repeat_penalty:1.1,num_predict:maxTok}})});
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
