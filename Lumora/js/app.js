import {loadRules,systemPrompt,attachment,crisis,rules} from "./rules.js";
import {loadMemory,learn,recall,exportLua,hasPII,forget} from "./memory.js";
import {pick,stream,switchModel,ensureCtx,ctxNow,isQwen3,getNivel,nameOf,MODEL_LIST} from "./engine.js";
import {loadKnowledge,relevant} from "./knowledge.js";
import {setDots} from "./dots.js";
import {menu,globe,ic,esc,toast} from "./ui.js";
import {quick} from "./fast.js";
import {webSearch} from "./search.js";
import {loadDocs,robloxDocs} from "./docs.js";
import {diagnose} from "./debug.js";
import {isSiteRequest,siteTopic,sitePrompt,SITE_SCHEMA,buildSite} from "./sitegen.js";

const $=id=>document.getElementById(id);
const ls=k=>{try{return localStorage.getItem(k);}catch{return null;}};
const lset=(k,v)=>{try{localStorage.setItem(k,v);}catch{}};
const K="lumora_chats",MAXFILE=5000,BYE="Este chat se eliminó: Lumora AI no crea vínculos afectivos. Puedes empezar uno nuevo para seguir con tus proyectos.";
const tok=s=>Math.ceil(String(s).length/3.2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
let chats=[],cur=null,busy=false,model=null,ctrl=null,modelError="",attach=null;
let think=ls("lumora_think")==="1",web=ls("lumora_web")==="1";
try{chats=JSON.parse(ls(K))||[];}catch{}
const save=()=>lset(K,JSON.stringify(chats));
const TAGS=/\[\[(APRENDER|FIN_CHAT)[^\]]*\]?\]?/g;
const strip=t=>t.replace(/<think>[\s\S]*?(<\/think>|$)/g,"").replace(TAGS,"").trim();
const compact=t=>t.replace(/```([^\n]*)\n([\s\S]*?)```/g,(m,i,b)=>b.length>500?"```"+i+"\n[contenido omitido]\n```":m);
const setSt=(t,cls)=>{$("st").textContent=t;$("dot").className=cls||"";};
const mob=()=>matchMedia("(max-width:800px)").matches;

function device(){const u=navigator.userAgent;
 const os=/Windows/.test(u)?"Windows":/Android/.test(u)?"Android":/iPhone|iPad/.test(u)?"iOS":/Mac/.test(u)?"macOS":/Linux/.test(u)?"Linux":"Dispositivo";
 const br=/Edg\//.test(u)?"Edge":/OPR\//.test(u)?"Opera":/Chrome\//.test(u)?"Chrome":/Firefox\//.test(u)?"Firefox":/Safari\//.test(u)?"Safari":"Navegador";
 return "Plan gratuito · "+os+" · "+br;}
const langOf=n=>{const e=(n.split(".").pop()||"").toLowerCase();return ({luau:"lua",mjs:"js",htm:"html",yml:"yaml",ps1:"powershell",sh:"bash",md:"markdown"})[e]||e||"";};

/* ---------- estado visible: globo girando + lo que Lumora está haciendo ---------- */
const mkStat=()=>el("div","stat",globe()+'<span class="stat-t">Pensando</span><span class="stat-s"></span>');
const setStat=(s,lab,sec)=>{s.querySelector(".stat-t").textContent=lab;s.querySelector(".stat-s").textContent=sec?sec+" s":"";};

/* ---------- plantillas: razonamiento visible, archivo, código ---------- */
function renderBody(raw,body,o={}){
 let t=raw.replace(TAGS,"");body.innerHTML="";
 const live=!!o.live,tm=t.match(/<think>([\s\S]*?)(<\/think>|$)/);
 if(tm){
  const closed=!!tm[2],txt=tm[1].trim();
  if(txt||!closed){
   const d=el("details","think");d.open=live&&!closed;
   const secs=Math.max(1,Math.round((o.ms||0)/1000));
   d.innerHTML=`<summary><span>${live&&!closed?"Pensando…":(o.ms?"Pensó durante "+secs+" s":"Razonamiento")}</span>${ic("chev","chev")}</summary>`;
   const p=el("div","tt");p.textContent=txt;d.appendChild(p);body.appendChild(d);
  }
  t=t.replace(tm[0],"");
 }
 t.split("```").forEach((part,i)=>{
  if(i%2===0){if(part.trim()){const s=el("div","tx");s.innerHTML=esc(part.replace(/^\n+|\n+$/g,"")).replace(/`([^`\n]+)`/g,'<code class="in">$1</code>').replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>");body.appendChild(s);}return;}
  const nl=part.indexOf("\n"),info=(nl>=0?part.slice(0,nl):part).trim(),code=nl>=0?part.slice(nl+1).replace(/\n$/,""):"";
  const [lang,...nm]=info.split(":"),name=nm.join(":").trim(),file=!!name;
  const card=el("div","card"+(file?" file":"")),h=el("div","h",`${ic(file?"file":"code")}${file?"<b></b><span>"+esc(lang)+"</span>":"<span>"+esc(lang||"código")+"</span>"}<span class="sp"></span>`);
  if(file)h.querySelector("b").textContent=name;
  const btn=(icon,label,fn)=>{const b=el("button","",ic(icon)+label);b.type="button";b.onclick=()=>fn(b);h.appendChild(b);};
  if(/^html?$/i.test(lang)&&!o.live)btn("eye","Vista previa",()=>window.open(URL.createObjectURL(new Blob([code],{type:"text/html"})),"_blank"));
  if(file)btn("down","Descargar",()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([code]));a.download=name.replace(/[\\/]/g,"_");a.click();});
  else btn("copy","Copiar",b=>navigator.clipboard.writeText(code).then(()=>{b.innerHTML=ic("check")+"Copiado";setTimeout(()=>b.innerHTML=ic("copy")+"Copiar",1500);}));
  const pre=el("pre");pre.textContent=code;card.append(h,pre);body.appendChild(card);
 });
}
function addMsg(m,last){
 const w=el("div","m "+(m.role==="user"?"user":"bot"));
 if(m.role==="user"){
  const b=el("div","bub");
  if(m.file){const f=el("div","ufile",ic("file")+"<span></span><small></small>");f.querySelector("span").textContent=m.file.name;f.querySelector("small").textContent="~"+tok(m.file.text)+" tokens";b.appendChild(f);}
  b.appendChild(document.createTextNode(m.content));w.appendChild(b);
 }else{
  const col=el("div","colm"),body=el("div","body");renderBody(m.content,body,{ms:m.think});col.appendChild(body);
  if(m.sources&&m.sources.length){const s=el("div","srcs");s.append("Fuentes:");m.sources.forEach(x=>{const a=el("a");a.href=x.u;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.t;s.appendChild(a);});col.appendChild(s);}
  const a=el("div","acts");let up,dn;
  const mk=(i,t,f,on,cls="")=>{const b=el("button",on?"on":"",ic(i,cls));b.title=t;b.setAttribute("aria-label",t);b.type="button";b.onclick=()=>f(b);a.appendChild(b);return b;};
  if(last)mk("retry","Reintentar",()=>retry());
  mk("copy","Copiar respuesta",b=>navigator.clipboard.writeText(strip(m.content)).then(()=>{b.innerHTML=ic("check");setTimeout(()=>b.innerHTML=ic("copy"),1500);}));
  up=mk("thumb","Me gusta",()=>rate(m,"up",up,dn),m.rating==="up");
  dn=mk("thumb","No me gusta",()=>rate(m,"down",up,dn),m.rating==="down","flip");
  col.appendChild(a);w.append(el("div","ic",ic("spark")),col);
 }
 $("msgs").appendChild(w);
}
function rate(m,v,up,dn){m.rating=m.rating===v?null:v;up.classList.toggle("on",m.rating==="up");dn.classList.toggle("on",m.rating==="down");save();}

/* ---------- chats y barra lateral ---------- */
function drawList(){
 const q=$("q").value.trim().toLowerCase(),l=$("list");l.innerHTML="";
 const f=chats.filter(c=>c.title.toLowerCase().includes(q));
 if(!f.length)l.appendChild(el("div","empty",q?"Sin resultados.":"Aún no hay chats."));
 f.forEach(c=>{const r=el("div","ci"+(c===cur?" on":""),"<span></span>");r.firstChild.textContent=c.title;
  const d=el("button","",ic("trash"));d.title="Eliminar chat";d.setAttribute("aria-label","Eliminar chat");d.onclick=e=>{e.stopPropagation();del(c);};
  r.appendChild(d);r.onclick=()=>{show(c);if(mob())drawer(false);};l.appendChild(r);});
}
function show(c,notice){
 cur=c;const empty=!c||!c.msgs.length;
 $("msgs").innerHTML="";$("title").textContent=c?c.title:"Nuevo chat";$("main").classList.toggle("is-empty",empty);
 if(notice)$("msgs").appendChild(el("div","notice",notice));
 if(empty)$("msgs").appendChild(el("div","hero","<h1>¿Qué vamos a crear hoy?</h1>"));
 else{c.msgs.forEach((m,i)=>addMsg(m,i===c.msgs.length-1));$("msgs").scrollTop=$("msgs").scrollHeight;}
 drawList();
}
function del(c,notice){chats=chats.filter(x=>x!==c);save();if(cur===c)show(null,notice);else drawList();}
function newChat(){show(null);$("in").focus();if(mob())drawer(false);}
const drawer=v=>{$("side").classList.toggle("open",v);$("scrim").classList.toggle("on",v);};
function sb(open){
 if(mob()){drawer(open);return;}
 document.body.classList.toggle("sb-off",!open);$("side").inert=!open;lset("lumora_sb",open?"1":"0");
}

/* ---------- aprende de tus «Me gusta» ---------- */
const wd=t=>(t.toLowerCase().match(/[a-záéíóúñ0-9_]{4,}/g)||[]);
function example(q){
 const w=new Set(wd(q));let best=null,bs=2;
 chats.forEach(c=>c.msgs.forEach((m,i)=>{
  if(m.role!=="assistant"||m.rating!=="up"||!c.msgs[i-1])return;
  const u=c.msgs[i-1].content,a=strip(m.content);if(a.length>900||hasPII(u)||hasPII(a))return;
  const s=wd(u).filter(x=>w.has(x)).length;if(s>bs){bs=s;best={u,a};}
 }));
 return best?"\nEjemplo de respuesta que gustó (pregunta: "+best.u.slice(0,120)+"):\n"+best.a:"";
}

/* ---------- GitHub: leer archivos públicos (recortado) ---------- */
async function fetchGitHubContext(text){
 const urls=text.match(/https?:\/\/(?:raw\.)?github(?:usercontent)?\.com\/[^\s)>"']+/gi)||[];
 if(!urls.length)return "";
 let out="";
 for(const u0 of urls.slice(0,2)){
  if(out.length>=3000)break;
  const u=u0.replace(/[.,;]+$/,"").replace("github.com/","raw.githubusercontent.com/").replace(/\/blob\//,"/").replace(/\/tree\//,"/");
  try{
   const r=await fetch(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error(r.status);
   let b=await r.text();if(b.length>2500)b=b.slice(0,2500)+"\n…[recortado]";
   out+="\n[GitHub "+u+"]\n"+b+"\n";
  }catch(e){out+="\n[GitHub "+u+": no se pudo leer ("+(e.message||e)+")]\n";}
 }
 return out;
}

/* ---------- cuánto contexto necesita cada pregunta ---------- */
const CODE=/\b(crea|crear|haz|hazme|escribe|genera|programa|script|codigo|código|funci[oó]n|ejemplo|arregla|corrige|error|bug|html|css|js|javascript|lua|luau|roblox|python|pagina|página|web|sitio)\b/i;
const DEF=/^[¿\s]*(qu[eé] es|qu[eé] son|qui[eé]n(es)? (es|son|fue)|cu[aá]l es|define|significa|por qu[eé]|cu[aá]nt[oa]s?)/i;
const ROBLOX=/\b(roblox|luau|lua|servidor|cliente|server|client|replicatedfirst|localscript|modulescript|remoteevent|playeradded|datastore|humanoid|studio|orden de carga)\b/i;
const GREET=/^[¡¿\s]*(hola|buenas|buen[oa]s|hey|gracias|ok|vale|adi[oó]s)\b/i;
const FOLLOW=/\b(eso|esto|esa|ese|esos|esas|anterior|arriba|contin[uú]a|sigue|mej[oó]ralo|corr[ií]gelo|c[aá]mbialo|otra vez|de nuevo|pero|adem[aá]s|y si|el c[oó]digo|ese c[oó]digo|el script|m[aá]s corto|m[aá]s largo)\b/i;
const MODIFY=/\b(modifica|modificar|edita|editar|cambia|cambiar|c[aá]mbial[oa]|agrega|agregar|a[ñn]ade|a[ñn]adir|quita|quitar|elimina|arregla|arreglar|corrige|corregir|mejora|mejorar|optimiza|refactoriza|convierte|traduce|renombra|actualiza|reemplaza|revisa)\b/i;
export function plan(q){const def=DEF.test(q);return {code:CODE.test(q)&&!def,standalone:def||GREET.test(q)||(!FOLLOW.test(q)&&!MODIFY.test(q)&&q.length>=30)};}
// Último archivo con el que se trabajó: adjunto del usuario o archivo que Lumora entregó.
function activeFile(c){
 for(let i=c.msgs.length-1;i>=0;i--){
  const m=c.msgs[i];
  if(m.role==="user"&&m.file)return {name:m.file.name,text:m.file.text};
  if(m.role==="assistant"){const r=/```([\w+-]*):([^\n]+)\n([\s\S]*?)```/g;let x,l=null;while((x=r.exec(m.content)))l={name:x[2].trim(),text:x[3]};if(l)return l;}
 }
 return null;
}
function buildHist(c,standalone){
 if(standalone)return [];
 const h=[];let size=0;
 for(let i=c.msgs.length-2;i>=0;i--){const m=c.msgs[i];if(m.err)continue;
  const txt=m.role==="assistant"?compact(strip(m.content)):m.content;
  if(h.length>=5||size+txt.length>3000)break;size+=txt.length;h.unshift({role:m.role,content:txt});}
 while(h.length&&h[0].role!=="user")h.shift();
 return h;
}

/* ---------- generación ---------- */
async function generate(){
 busy=true;setDots(false);setSend();
 const c=cur,last=c.msgs[c.msgs.length-1],q=last.content,{code,standalone}=plan(q);
 const w=el("div","m bot"),stat=mkStat(),body=el("div","body"),col=el("div","colm");
 col.append(stat,body);w.append(el("div","ic",ic("spark")),col);$("msgs").appendChild(w);
 const box=$("msgs"),near=()=>box.scrollHeight-box.scrollTop-box.clientHeight<170,stick=()=>{box.scrollTop=box.scrollHeight;};
 stick();
 let full="",stage="",sec=0,thinkMs=0,thinkDone=false,sources=[],pend=false,lastP=0;
 const t0=performance.now();
 const phase=()=>{
  if(stage)return stage;
  if(/<think>(?![\s\S]*<\/think>)/.test(full))return "Pensando";
  const t=full.replace(/<think>[\s\S]*?<\/think>/g,"");
  if((t.match(/```/g)||[]).length%2===1)return "Codeando";
  return t.trim()?"Escribiendo":"Pensando";
 };
 const paint=()=>{pend=false;lastP=performance.now();renderBody(full,body,{live:true,ms:thinkMs});setStat(stat,phase(),sec);if(near())stick();};
 const sched=()=>{if(!pend){pend=true;setTimeout(paint,Math.max(0,90-(performance.now()-lastP)));}};
 const tick=setInterval(()=>{sec=Math.round((performance.now()-t0)/1000);setStat(stat,phase(),sec);},500);
 const onTok=t=>{if(!full)stage="";full+=t;if(!thinkDone&&full.includes("</think>")){thinkDone=true;thinkMs=performance.now()-t0;}sched();};
 const status=x=>setSt(x,"ok");
 ctrl=new AbortController();
 try{
  // 1) Respuesta instantánea para cosas simples: Lumora ya sabe qué decir
  const qa=!last.file&&quick(q,model);
  if(qa){stat.hidden=true;let i=0;while(i<qa.length){i=Math.min(qa.length,i+3);renderBody(qa.slice(0,i),body,{});if(near())stick();await sleep(10);}full=qa;}
  // 2) «Crea un sitio web»: el modelo escribe el contenido y Lumora lo monta en una plantilla profesional
  else if(isSiteRequest(q)&&!last.file){
   stage="Codeando";setStat(stat,stage,0);const topic=siteTopic(q);let json="";
   await stream(model,[{role:"system",content:"Eres un generador de contenido para sitios web. Responde solo con JSON válido en español."},{role:"user",content:sitePrompt(topic)}],t=>{json+=t;},ctrl.signal,status,{schema:SITE_SCHEMA,maxTok:700});
   let d=null;try{d=JSON.parse(json.slice(json.indexOf("{"),json.lastIndexOf("}")+1));}catch{}
   full="He creado tu sitio «"+((d&&d.name)||topic)+"». Ábrelo en vista previa o descárgalo; si quieres cambios (colores, textos, secciones), pídemelos.\n```html:index.html\n"+buildSite(d,topic)+"\n```";
  }
  // 3) Conversación normal, con razonamiento, internet y archivos si el usuario los pidió
  else{
   let extra="";
   const dx=diagnose(q),rbx=ROBLOX.test(q);
   if(code||rbx||dx)extra+=relevant(dx?q+" error depurar corregir":q)+(code?example(q):"");
   if(dx)extra+=dx;
   const rd=await robloxDocs(q,()=>{stage="Leyendo la documentación";setStat(stat,stage,0);});
   if(rd.text){extra+="\nDOCUMENTACIÓN OFICIAL DE ROBLOX (usa los nombres exactos de métodos y eventos):\n"+rd.text;sources=sources.concat(rd.sources);}
   stage="";
   const gh=await fetchGitHubContext(q);if(gh)extra+=gh;
   if(web&&q.length>5&&!GREET.test(q)){
    stage="Investigando";setStat(stat,stage,0);
    const r=await webSearch(q);sources=r.sources;
    extra+=r.text?"\nRESULTADOS DE INTERNET (cita la fuente; si no responden la pregunta, di que no posees conocimiento verificado):\n"+r.text:"\nINTERNET: no se encontraron resultados; si no lo sabes con certeza, di que no posees conocimiento.";
   }
   let af=last.file?{name:last.file.name,text:last.file.text}:((MODIFY.test(q)||FOLLOW.test(q))?activeFile(c):null);
   if(think&&!isQwen3())extra+="\nRazona primero dentro de <think>…</think> (máx. 6 frases) y después da la respuesta final.";
   let maxTok=think?1600:af?1500:(code||dx)?1200:500;
   const mkUser=()=>af?"Archivo «"+af.name+"»:\n```"+langOf(af.name)+"\n"+af.text+"\n```\n\n"+q:q;
   const fileNote=()=>af?"\nARCHIVO: "+(tok(af.text)<=1500?"si lo modificas, devuélvelo COMPLETO en un bloque ```"+langOf(af.name)+":"+af.name+".":"es grande: devuelve SOLO las partes cambiadas, cada una en su bloque de código con un comentario que diga dónde va."):"";
   let hist=buildHist(c,standalone),sys=systemPrompt(recall(q),extra+fileNote(),model),user=mkUser();
   const need=()=>tok(sys)+hist.reduce((a,m)=>a+tok(m.content),0)+tok(user)+maxTok+60;
   if(af){stage="Leyendo el archivo";setStat(stat,stage,0);await ensureCtx(need(),status);}
   const cx=ctxNow();
   while(need()>cx&&hist.length)hist.shift();
   if(need()>cx)maxTok=Math.max(300,maxTok-(need()-cx));
   if(need()>cx&&af){const keep=Math.max(800,tok(af.text)-(need()-cx)-100);af={name:af.name,text:af.text.slice(0,Math.floor(keep*3.2))+"\n…[archivo recortado por el límite de contexto]"};user=mkUser();sys=systemPrompt(recall(q),extra+fileNote(),model);}
   await stream(model,[{role:"system",content:sys},...hist,{role:"user",content:user}],onTok,ctrl.signal,status,{think,maxTok});
  }
  c.msgs.push({role:"assistant",content:full,sources,think:thinkMs||undefined});save();
  if(/\[\[FIN_CHAT\]\]/.test(full)&&!crisis(q)){clearInterval(tick);busy=false;setDots(true);setSend();return del(c,BYE);}
 }catch(e){
  if(e&&e.name==="AbortError"||ctrl.signal.aborted){c.msgs.push({role:"assistant",content:full||"(Detenido)",sources,think:thinkMs||undefined});}
  else{
   let msg=e.message||String(e);
   if(/context|exceed|window/i.test(msg))msg="la conversación o el archivo es demasiado grande para el modelo. Abre un chat nuevo o adjunta un archivo más corto.";
   else if(/lost|device|gpu|memory|out of/i.test(msg))msg="la gráfica dejó de responder (suele ser por memoria o calor). Recarga la página con Ctrl + F5: el modelo ya está descargado y carga rápido.";
   c.msgs.push({role:"assistant",content:"No pude generar la respuesta: "+msg,err:true});
  }
  save();
 }finally{clearInterval(tick);busy=false;setDots(true);setSend();setSt(model||"Sin modelo",model?"ok":"");if(cur===c)show(c);}
}
async function submit(txt){
 if(busy){ctrl&&ctrl.abort();return;}
 let text=(txt!=null?txt:$("in").value).trim();if(!text&&!attach)return;
 if(!text&&attach)text="Explícame qué hace este archivo y dime cómo lo mejorarías.";
 if(!cur){cur={id:Date.now(),title:text.slice(0,40),msgs:[],strikes:0};chats.unshift(cur);}
 $("in").value="";autosize();
 const m=text.match(/^(?:recuerda|aprende|memoriza)(?:\s+que|:)?\s+(.{6,})/i);if(m)learn(m[1]);
 const msg={role:"user",content:text};if(attach){msg.file=attach;attach=null;drawChips();}
 cur.msgs.push(msg);
 if(attachment(text)&&!crisis(text)&&++cur.strikes>=rules().strikes)return del(cur,BYE);
 save();
 if(!model&&(msg.file||!quick(text,model))){cur.msgs.push({role:"assistant",content:"Todavía no hay un modelo listo. "+(modelError||"Espera a que termine de cargar (mira el estado arriba a la derecha)."),err:true});save();return show(cur);}
 show(cur);await generate();
}
function retry(){if(busy||!cur)return;cur.msgs.pop();save();show(cur);generate();}

/* ---------- archivos adjuntos (hasta ~5000 tokens) ---------- */
const EXT=/\.(txt|md|js|mjs|ts|jsx|tsx|json|html?|css|scss|lua|luau|py|csv|xml|ya?ml|sh|bat|ps1|java|c|h|cpp|cs|php|sql|ini|cfg|toml|rb|go|rs|kt|swift)$/i;
const readText=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result));r.onerror=()=>no(r.error);r.readAsText(f);});
async function attachFile(f){
 if(!f)return;
 if(!EXT.test(f.name)&&!/^text\//.test(f.type)){toast("Ese archivo no es de texto o código.");return;}
 if(f.size>600000){toast("El archivo es muy grande (máximo ~600 KB).");return;}
 let text=await readText(f),cut=false;
 if(/\u0000/.test(text.slice(0,2000))){toast("Ese archivo parece binario.");return;}
 const maxChars=Math.floor(MAXFILE*3.2);
 if(text.length>maxChars){text=text.slice(0,maxChars)+"\n…[recortado a ~5000 tokens]";cut=true;}
 attach={name:f.name,text,cut};drawChips();setSend();$("in").focus();
 if(cut)toast("Archivo recortado a ~5000 tokens.");
}
function drawChips(){
 const c=$("chips");c.innerHTML="";if(!attach)return;
 const d=el("div","chip",ic("file")+"<span></span><small></small><button type='button' aria-label='Quitar archivo'>"+ic("x")+"</button>");
 d.querySelector("span").textContent=attach.name;d.querySelector("small").textContent="~"+tok(attach.text)+" tokens"+(attach.cut?" · recortado":"");
 d.querySelector("button").onclick=()=>{attach=null;drawChips();setSend();};c.appendChild(d);
}

/* ---------- barra de escritura ---------- */
const autosize=()=>{const t=$("in");t.style.height="auto";t.style.height=Math.min(t.scrollHeight,170)+"px";};
function setSend(){const b=$("send");b.classList.toggle("stop",busy);b.innerHTML=ic(busy?"stop":"send");b.setAttribute("aria-label",busy?"Detener":"Enviar");b.disabled=!busy&&!($("in").value.trim()||attach);}
function setTog(id,on){$(id).setAttribute("aria-pressed",on?"true":"false");}
async function changeModel(key){
 if(busy||key===getNivel())return;
 model=null;setSt("Cargando…","");setDots(false);
 try{model=await switchModel(key,x=>setSt(x,""));setSt(model,"ok");}
 catch(e){modelError=e.message;setSt("Sin motor","");toast("No pude cargar ese modelo: "+e.message);}
 $("mname").textContent=model||nameOf(getNivel());setDots(true);setSend();
}
function pickSuggest(a){
 if(a==="file"){$("file").click();return;}
 $("in").value=a==="site"?"Crea un sitio web para ":"Escribe un script de Roblox que ";
 autosize();setSend();$("in").focus();
}

/* ---------- configuración y exportaciones ---------- */
function exportData(){
 const sys=systemPrompt([]),out=[];
 chats.forEach(c=>c.msgs.forEach((m,i)=>{
  if(m.role!=="assistant"||m.rating!=="up"||!c.msgs[i-1])return;
  const u=c.msgs[i-1].content,a=strip(m.content);if(hasPII(u)||hasPII(a))return;
  out.push(JSON.stringify({messages:[{role:"system",content:sys},{role:"user",content:u},{role:"assistant",content:a}]}));
 }));
 if(!out.length){toast("Aún no hay respuestas con «Me gusta» para exportar.");return;}
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([out.join("\n")],{type:"application/jsonl"}));a.download="lumora_dataset.jsonl";a.click();
}
const openModal=()=>{$("dev2").textContent=device();$("modal").hidden=false;$("mClose").focus();};
const closeModal=()=>{$("modal").hidden=true;};

/* ---------- arranque ---------- */
$("form").onsubmit=e=>{e.preventDefault();submit();};
$("send").onclick=e=>{if(busy){e.preventDefault();submit();}};
$("in").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit();}};
$("in").oninput=()=>{autosize();setSend();};
$("new").onclick=newChat;$("q").oninput=drawList;
$("menu").onclick=()=>sb(true);$("sbClose").onclick=()=>sb(false);$("scrim").onclick=()=>drawer(false);
$("acct").onclick=openModal;$("mClose").onclick=closeModal;
$("modal").addEventListener("mousedown",e=>{if(e.target===$("modal"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").hidden)closeModal();});
$("exp").onclick=exportLua;$("ds").onclick=exportData;
$("fg").onclick=()=>{if(confirm("¿Borrar todo lo que Lumora aprendió de ti?")){forget();toast("Lumora olvidó lo aprendido.");}};
$("wipe").onclick=()=>{if(confirm("¿Borrar todos los chats de este dispositivo?")){chats=[];save();closeModal();show(null);}};
$("tThink").onclick=()=>{think=!think;lset("lumora_think",think?"1":"0");setTog("tThink",think);toast(think?"Pensar activado: verás el razonamiento (más lento).":"Pensar desactivado: respuestas directas y rápidas.");};
$("tWeb").onclick=()=>{web=!web;lset("lumora_web",web?"1":"0");setTog("tWeb",web);toast(web?"Buscar activado: Lumora consultará Wikipedia y Stack Overflow.":"Buscar desactivado.");};
$("modelBtn").onclick=()=>menu($("modelBtn"),MODEL_LIST,{selected:getNivel(),right:true,footer:"Basados en modelos abiertos Qwen (Apache 2.0)",onPick:it=>changeModel(it.key)});
$("plus").onclick=()=>menu($("plus"),[{key:"file",name:"Adjuntar archivo",desc:"Texto o código, hasta ~5000 tokens",icon:"clip"},{key:"site",name:"Crear un sitio web",desc:"Lumora arma la página por ti",icon:"code"}],{minWidth:300,onPick:it=>pickSuggest(it.key)});
$("suggest").onclick=e=>{const b=e.target.closest("button");if(b)pickSuggest(b.dataset.a);};
$("file").onchange=e=>{attachFile(e.target.files[0]);e.target.value="";};
$("dev").textContent=device();setTog("tThink",think);setTog("tWeb",web);setSend();
(async()=>{
 if(!mob()&&ls("lumora_sb")==="0")sb(false);
 await Promise.all([loadRules(),loadMemory(),loadKnowledge(),loadDocs()]);show(null);
 setDots(false);
 try{model=await pick(x=>setSt(x,""));setSt(model||"Sin modelos",model?"ok":"");}
 catch(e){modelError=e.message;setSt("Sin motor","");show(cur,"No se pudo iniciar el motor: "+modelError);}
 $("mname").textContent=model||nameOf(getNivel());setDots(true);setSend();
})();
