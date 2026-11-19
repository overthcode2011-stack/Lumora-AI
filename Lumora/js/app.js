import {loadRules,systemPrompt,attachment,crisis,rules} from "./rules.js";
import {loadMemory,learn,recall,exportLua,hasPII,forget} from "./memory.js";
import {pick,stream,getNivel,setNivel} from "./engine.js";
import {loadKnowledge,relevant} from "./knowledge.js";
import {setDots} from "./dots.js";
const $=id=>document.getElementById(id);
const ic=(n,c="")=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const K="lumora_chats",BYE="Este chat se eliminó: Lumora AI no crea vínculos afectivos. Puedes empezar uno nuevo para seguir con tus proyectos.";
let chats=[],cur=null,busy=false,model=null,ctrl=null,modelError="";
function add_err(){const n=el("div","notice");n.textContent="No se pudo iniciar el motor: "+modelError;$("msgs").appendChild(n);}
try{chats=JSON.parse(localStorage.getItem(K))||[];}catch{}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(chats));}catch{}};
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const drawer=v=>{$("side").classList.toggle("open",v);$("scrim").classList.toggle("on",v);};
const TAGS=/\[\[(APRENDER|FIN_CHAT)[^\]]*\]?\]?/g;
const strip=t=>t.replace(/<think>[\s\S]*?(<\/think>|$)/g,"").replace(TAGS,"").trim();

function device(){const u=navigator.userAgent;
 const os=/Windows/.test(u)?"Windows":/Android/.test(u)?"Android":/iPhone|iPad/.test(u)?"iOS":/Mac/.test(u)?"macOS":/Linux/.test(u)?"Linux":"Dispositivo";
 const br=/Edg\//.test(u)?"Edge":/OPR\//.test(u)?"Opera":/Chrome\//.test(u)?"Chrome":/Firefox\//.test(u)?"Firefox":/Safari\//.test(u)?"Safari":"Navegador";
 return os+" · "+br;}

/* ---- plantillas: pensamiento, archivo, código ---- */
function renderBody(raw,body,live){
 let t=raw.replace(TAGS,"");body.innerHTML="";
 const tm=t.match(/<think>([\s\S]*?)(<\/think>|$)/);
 if(tm&&tm[2]&&!tm[1].trim())t=t.replace(tm[0],"");
 else if(tm){const open=live&&!tm[2],d=el("details","think",`<summary>${ic("spark",open?"spin":"")}<span>${open?"Pensando…":"Razonamiento"}</span>${ic("chev","chev")}</summary>`);
  d.open=open;const p=el("div");p.textContent=tm[1].trim();d.appendChild(p);body.appendChild(d);t=t.replace(tm[0],"");}
 else if(live&&!t.trim())body.appendChild(el("div","think",`<summary style="display:flex;gap:8px;align-items:center">${ic("spark","spin")}<span>Pensando…</span></summary>`));
 t.split("```").forEach((part,i)=>{
  if(i%2===0){if(part.trim()){const s=el("div","tx");s.innerHTML=esc(part.replace(/^\n+|\n+$/g,"")).replace(/`([^`\n]+)`/g,'<code class="in">$1</code>').replace(/\*\*([^*\n]+)\*\*/g,"<b>$1</b>");body.appendChild(s);}return;}
  const nl=part.indexOf("\n"),info=(nl>=0?part.slice(0,nl):part).trim(),code=nl>=0?part.slice(nl+1).replace(/\n$/,""):"";
  const [lang,...nm]=info.split(":"),name=nm.join(":").trim(),file=!!name;
  const card=el("div","card"+(file?" file":"")),h=el("div","h",`${ic(file?"file":"code")}${file?`<b></b><span>${esc(lang)}</span>`:`<span>${esc(lang||"código")}</span>`}<span class="sp"></span>`);
  if(file)h.querySelector("b").textContent=name;
  const b=el("button","",`${ic(file?"down":"copy")}${file?"Descargar":"Copiar"}`);b.type="button";
  b.onclick=()=>{if(file){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([code]));a.download=name.replace(/[\\/]/g,"_");a.click();}
   else navigator.clipboard.writeText(code).then(()=>{b.innerHTML=ic("check")+"Copiado";setTimeout(()=>b.innerHTML=ic("copy")+"Copiar",1500);});};
  h.appendChild(b);const pre=el("pre");pre.textContent=code;card.append(h,pre);body.appendChild(card);
 });
}
function addMsg(m,last){
 const w=el("div","m "+(m.role==="user"?"user":"bot"));
 if(m.role==="user"){const b=el("div","bub");b.textContent=m.content;w.appendChild(b);}
 else{w.appendChild(el("div","ic",ic("spark")));const body=el("div","body"),main=el("div");renderBody(m.content,body,false);
  const a=el("div","acts");let up,dn;
  const mk=(i,t,f,on,cls="")=>{const b=el("button",on?"on":"",ic(i,cls));b.title=t;b.setAttribute("aria-label",t);b.type="button";b.onclick=()=>f(b);a.appendChild(b);return b;};
  if(last)mk("retry","Reintentar",()=>retry());
  mk("copy","Copiar respuesta",b=>navigator.clipboard.writeText(strip(m.content)).then(()=>{b.innerHTML=ic("check");setTimeout(()=>b.innerHTML=ic("copy"),1500);}));
  up=mk("thumb","Me gusta",()=>rate(m,"up",up,dn),m.rating==="up");
  dn=mk("thumb","No me gusta",()=>rate(m,"down",up,dn),m.rating==="down","flip");
  main.append(body,a);w.appendChild(main);}
 $("msgs").appendChild(w);$("msgs").scrollTop=$("msgs").scrollHeight;
}
function rate(m,v,up,dn){m.rating=m.rating===v?null:v;up.classList.toggle("on",m.rating==="up");dn.classList.toggle("on",m.rating==="down");save();}

/* ---- chats y barra lateral ---- */
function drawList(){
 const q=$("q").value.trim().toLowerCase(),l=$("list");l.innerHTML="";
 const f=chats.filter(c=>c.title.toLowerCase().includes(q));
 if(!f.length)l.appendChild(el("div","empty",q?"Sin resultados.":"Aún no hay chats."));
 f.forEach(c=>{const r=el("div","ci"+(c===cur?" on":""),"<span></span>");r.firstChild.textContent=c.title;
  const d=el("button","",ic("trash"));d.title="Eliminar chat";d.setAttribute("aria-label","Eliminar chat");d.onclick=e=>{e.stopPropagation();del(c);};
  r.appendChild(d);r.onclick=()=>{show(c);drawer(false);};l.appendChild(r);});
}
function greeting(){
 const h=new Date().getHours();
 let g="Buenas noches";
 if(h>=5&&h<12)g="Buenos días";
 else if(h>=12&&h<20)g="Buenas tardes";
 return g;
}
function show(c,notice){
 cur=c;$("msgs").innerHTML="";$("title").textContent=c?c.title:"Nuevo chat";
 if(notice)$("msgs").appendChild(el("div","notice",notice));
 if(!c||!c.msgs.length)$("msgs").appendChild(el("div","hero",`${ic("spark")}<h2>${greeting()}</h2><div>Soy Lumora. Pregúntame sobre HTML, CSS, JavaScript, Lua, Roblox o cualquier script. Si te entrego un archivo, lo verás listo para descargar.</div>`));
 else c.msgs.forEach((m,i)=>addMsg(m,i===c.msgs.length-1));
 drawList();
}
function del(c,notice){chats=chats.filter(x=>x!==c);save();if(cur===c)show(null,notice);else drawList();}
function newChat(){show(null);$("in").focus();drawer(false);}

/* ---- aprende de tus «Me gusta»: usa una respuesta buena parecida como ejemplo ---- */
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


/* ---- GitHub: leer archivos públicos (raw), recortado para no desbordar al modelo ---- */
async function fetchGitHubContext(text){
 const urls=text.match(/https?:\/\/(?:raw\.)?github(?:usercontent)?\.com\/[^\s)>"']+/gi)||[];
 if(!urls.length)return "";
 let out="";
 for(const u0 of urls.slice(0,2)){
  if(out.length>=3000)break;
  const u=u0.replace(/[.,;]+$/,"").replace("github.com/","raw.githubusercontent.com/").replace(/\/blob\//,"/").replace(/\/tree\//,"/");
  try{
   $("st").textContent="Leyendo GitHub…";
   const r=await fetch(u,{signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw new Error(r.status);
   let body=await r.text();if(body.length>2500)body=body.slice(0,2500)+"\n…[recortado]";
   out+="\n[GitHub "+u+"]\n"+body+"\n";
  }catch(e){out+="\n[GitHub "+u+": no se pudo leer ("+(e.message||e)+")]\n";}
 }
 return out;
}

/* ---- cuánto contexto necesita cada pregunta: menos texto = más rápido y sin «arrastre» de temas viejos ---- */
const CODE=/\b(crea|crear|haz|hazme|escribe|genera|programa|script|codigo|código|funci[oó]n|ejemplo|arregla|corrige|error|bug|html|css|js|javascript|lua|luau|roblox|python|pagina|página|web|sitio)\b/i;
const DEF=/^[¿\s]*(qu[eé] es|qu[eé] son|qui[eé]n(es)? (es|son|fue)|cu[aá]l es|define|significa|por qu[eé]|cu[aá]nt[oa]s?)/i;
const GREET=/^[¡¿\s]*(hola|buenas|buen[oa]s|hey|gracias|ok|vale|adi[oó]s)\b/i;
const FOLLOW=/\b(eso|esto|esa|ese|esos|esas|anterior|arriba|contin[uú]a|sigue|mej[oó]ralo|corr[ií]gelo|c[aá]mbialo|otra vez|de nuevo|pero|adem[aá]s|y si|el c[oó]digo|ese c[oó]digo|el script|m[aá]s corto|m[aá]s largo)\b/i;
export function plan(q){
 const def=DEF.test(q);
 return {code:CODE.test(q)&&!def,standalone:def||GREET.test(q)||(!FOLLOW.test(q)&&q.length>=30)};
}

/* ---- generación ---- */
async function generate(){
 busy=true;setDots(false);$("send").disabled=true;const c=cur,q=c.msgs[c.msgs.length-1].content;
 const {code,standalone}=plan(q);
 const gh=await fetchGitHubContext(q);
 // Preguntas sueltas: solo el mensaje actual. Seguimientos ("mejóralo", "eso"): hasta 6 mensajes y ~3500 caracteres.
 const hist=[];let size=0;
 for(let i=c.msgs.length-1;i>=0;i--){const m=c.msgs[i];if(m.err)continue;
  if(hist.length&&(standalone||hist.length>=6||size+m.content.length>3500))break;
  const txt=m.role==="assistant"?strip(m.content):m.content;size+=txt.length;hist.unshift({role:m.role,content:txt});}
 while(hist.length>1&&hist[0].role!=="user")hist.shift();
 const extra=(code?relevant(q)+example(q):"")+gh;
 const msgs=[{role:"system",content:systemPrompt(recall(q),extra,model)},...hist];
 const w=el("div","m bot",`<div class="ic">${ic("spark")}</div><div class="body"></div>`),body=w.querySelector(".body");
 renderBody("",body,true);$("msgs").appendChild(w);$("msgs").scrollTop=$("msgs").scrollHeight;
 let full="",last=0,pend=false;ctrl=new AbortController();
 // Pintar como máximo ~11 veces por segundo: redibujar en cada token frena mucho el móvil.
 const paint=()=>{pend=false;last=performance.now();renderBody(full,body,true);$("msgs").scrollTop=$("msgs").scrollHeight;};
 try{
  await stream(model,msgs,t=>{full+=t;if(!pend){pend=true;setTimeout(paint,Math.max(0,90-(performance.now()-last)));}},ctrl.signal,x=>{$("st").textContent=x;},{long:code});
  c.msgs.push({role:"assistant",content:full});save();
  if(/\[\[FIN_CHAT\]\]/.test(full)&&!crisis(q))return del(c,BYE);
 }catch(e){
  let msg=e.message||String(e);
  if(/context|exceed|window/i.test(msg))msg="la conversación ya es demasiado larga para el modelo. Abre un chat nuevo con «Nuevo chat».";
  else if(/lost|device|gpu|memory|out of/i.test(msg))msg="la gráfica dejó de responder (suele ser por memoria o calor). Recarga la página con Ctrl + F5: el modelo ya está descargado y carga rápido.";
  c.msgs.push({role:"assistant",content:"No pude generar la respuesta: "+msg,err:true});save();
 }finally{busy=false;setDots(true);$("send").disabled=false;$("st").textContent=model||"Sin modelo";if(cur===c)show(c);}
}
async function submit(){
 const text=$("in").value.trim();if(!text||busy)return;
 if(!cur){cur={id:Date.now(),title:text.slice(0,40),msgs:[],strikes:0};chats.unshift(cur);}
 $("in").value="";$("in").style.height="48px";
 const m=text.match(/^(?:recuerda|aprende|memoriza)(?:\s+que|:)?\s+(.{6,})/i);if(m)learn(m[1]);
 cur.msgs.push({role:"user",content:text});
 if(attachment(text)&&!crisis(text)&&++cur.strikes>=rules().strikes)return del(cur,BYE);
 save();
 if(!model){cur.msgs.push({role:"assistant",content:"Todavía no hay un modelo listo. "+(modelError||"Espera a que termine de cargar (mira el estado arriba a la derecha).")});save();return show(cur);}
 show(cur);await generate();
}
function retry(){if(busy||!cur)return;cur.msgs.pop();save();show(cur);generate();}

/* ---- datos para entrenar: solo respuestas con «Me gusta» y sin datos personales ---- */
function exportData(){
 const sys=systemPrompt([]),out=[];
 chats.forEach(c=>c.msgs.forEach((m,i)=>{
  if(m.role!=="assistant"||m.rating!=="up"||!c.msgs[i-1])return;
  const u=c.msgs[i-1].content,a=strip(m.content);if(hasPII(u)||hasPII(a))return;
  out.push(JSON.stringify({messages:[{role:"system",content:sys},{role:"user",content:u},{role:"assistant",content:a}]}));
 }));
 if(!out.length){alert("Aún no hay respuestas con «Me gusta» para exportar.");return;}
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([out.join("\n")],{type:"application/jsonl"}));a.download="lumora_dataset.jsonl";a.click();
}
$("ds").onclick=exportData;
$("fg").onclick=()=>{if(confirm("¿Borrar todo lo que Lumora aprendió de ti?")){forget();alert("Listo: Lumora olvidó lo aprendido.");}};

/* ---- arranque ---- */
$("form").onsubmit=e=>{e.preventDefault();submit();};
$("in").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}};
$("in").oninput=e=>{e.target.style.height="48px";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";};
$("nivel").value=getNivel();$("nivel").onchange=e=>{setNivel(e.target.value);location.reload();};
$("new").onclick=newChat;$("q").oninput=drawList;$("exp").onclick=exportLua;
$("menu").onclick=()=>drawer(!$("side").classList.contains("open"));$("scrim").onclick=()=>drawer(false);$("dev").textContent=device();
(async()=>{
 await Promise.all([loadRules(),loadMemory(),loadKnowledge()]);show(null);
 setDots(false);$("send").disabled=true;try{model=await pick(t=>$("st").textContent=t);$("st").textContent=model||"Sin modelos";$("dot").className=model?"ok":"";}catch(e){$("st").textContent="Sin motor";modelError=e.message;add_err();}$("send").disabled=false;setDots(true);
})();
