// Motor de IA. Por defecto corre DENTRO del navegador con WebLLM (WebGPU): sin servidor, sin app, gratis.
// Si abres el sitio con ?server=https://... usa Ollama en tu PC; con ?server=off vuelve al modo navegador.
const WEBLLM="https://esm.run/@mlc-ai/web-llm@0.2.86";
const qs=new URLSearchParams(location.search).get("server");
if(qs)try{qs==="off"?localStorage.removeItem("lumora_ollama"):localStorage.setItem("lumora_ollama",qs.replace(/\/$/,""));}catch{}
const OLLAMA=localStorage.getItem("lumora_ollama");
// IMPORTANTE: IDs REALES de WebLLM (no los renombres). El nombre visible es pro-coder-vN.
const Q06="Qwen3-0.6B",Q17="Qwen3-1.7B",Q4="Qwen3-4B",C7="Qwen2.5-Coder-7B-Instruct";
const NAME={[Q06]:"pro-coder-v1",[Q17]:"pro-coder-v2",[Q4]:"pro-coder-v3",[C7]:"pro-coder-v4"};
const MODELS={"pro-coder1":[Q06],"pro-coder2":[Q17,Q06],"pro-coder3":[Q4,Q17,Q06],"pro-coder4":[C7,Q4,Q17]};
export const MODEL_LIST=[
 {key:"pro-coder1",name:"pro-coder-v1",tag:"Rápido",desc:"Ligero · ~1.4 GB",icon:"spark"},
 {key:"pro-coder2",name:"pro-coder-v2",tag:"Equilibrado",desc:"Estable · ~2 GB",icon:"spark"},
 {key:"pro-coder3",name:"pro-coder-v3",tag:"Preciso",desc:"Más inteligente · ~3.4 GB",icon:"spark"},
 {key:"pro-coder4",name:"pro-coder-v4",tag:"Máximo",desc:"Especialista en código · ~5 GB",icon:"spark"}
];
const OLD={ligero:"pro-coder1",equilibrado:"pro-coder2",potente:"pro-coder3",maximo:"pro-coder4"};
export const getNivel=()=>{const n=localStorage.getItem("lumora_nivel");return MODELS[n]?n:OLD[n]||"pro-coder2";};
export const setNivel=n=>{try{localStorage.setItem("lumora_nivel",n);}catch{}};
export const nameOf=k=>(MODEL_LIST.find(m=>m.key===k)||{}).name||k;
const TEMP=0.15,TOP_P=0.8,REPEAT=1.08,BIG=8192;
let eng=null,mode="web",create=null,loadedId=null,loadedName=null,ctx=4096;
export const ctxNow=()=>ctx;
export const isQwen3=()=>/^Qwen3-/.test(loadedId||"");
const prog=(cb,label)=>p=>cb(`${label} ${Math.round((p.progress||0)*100)}%`);

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
  const id=`${base}-${q}-MLC`;
  try{
   create=CreateMLCEngine;loadedId=id;loadedName=NAME[base];ctx=4096;
   eng=await CreateMLCEngine(id,{initProgressCallback:prog(onProgress,`Cargando ${NAME[base]}…`)});
   return NAME[base];
  }catch(e){last=e;}
 }
 throw new Error("No pude cargar el modelo en tu GPU: "+(last&&last.message||last));
}
// Cambiar de modelo sin recargar la página.
export async function switchModel(key,onProgress){
 setNivel(key);
 if(eng){try{await eng.unload();}catch{}eng=null;}
 return pick(onProgress);
}
// Para archivos grandes: amplía el contexto de 4096 a 8192 tokens (solo cuando hace falta).
export async function ensureCtx(needTokens,onStatus=()=>{}){
 if(mode!=="web"||!eng||needTokens<=ctx||ctx>=BIG)return ctx;
 onStatus("Ampliando memoria…");
 try{await eng.reload(loadedId,{context_window_size:BIG});ctx=BIG;}
 catch(e){try{await eng.reload(loadedId);}catch{}ctx=4096;}
 onStatus(loadedName);return ctx;
}

// o: {think, maxTok, schema}. think=true muestra el razonamiento; false responde directo (más rápido).
export async function stream(model,messages,onTok,signal,onStatus=()=>{},o={}){
 const maxTok=o.maxTok||700;
 if(mode==="web"){
  signal&&signal.addEventListener("abort",()=>eng&&eng.interruptGenerate());
  let got=false;
  const run=async(extra)=>{
   const th=!!o.think;
   const req={messages,stream:true,temperature:th?0.3:TEMP,top_p:th?0.9:TOP_P,repetition_penalty:REPEAT,max_tokens:maxTok};
   if(extra&&isQwen3())req.extra_body={enable_thinking:th};
   if(extra&&o.schema)req.response_format={type:"json_object",schema:JSON.stringify(o.schema)};
   const chunks=await eng.chat.completions.create(req);
   for await(const c of chunks){const t=c.choices[0]&&c.choices[0].delta&&c.choices[0].delta.content;if(t){got=true;onTok(t);}}
  };
  try{await run(true);}
  catch(e){
   const m=String(e&&e.message);
   if(got)throw e;
   if(/enable_thinking|extra_body|response_format|schema|grammar/i.test(m)){await run(false);return;}
   if(!create||!/not loaded|device|lost|reload/i.test(m))throw e;
   eng=await create(loadedId,{initProgressCallback:prog(onStatus,"Recargando modelo…")});ctx=4096;
   onStatus(loadedName);await run(true);
  }
  return;
 }
 const body={model,messages,stream:true,options:{temperature:TEMP,top_p:TOP_P,repeat_penalty:1.1,num_predict:maxTok,num_ctx:BIG}};
 if(o.schema)body.format=o.schema;
 if(/qwen3|deepseek-r1/i.test(model))body.think=!!o.think;
 const r=await fetch(OLLAMA+"/api/chat",{method:"POST",signal,body:JSON.stringify(body)});
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
