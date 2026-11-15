import {loadRules,systemPrompt,attachment,crisis,rules} from "./rules.js";
import {loadMemory,learn,recall,exportLua} from "./memory.js";
import {pick,stream} from "./engine.js";
const $=id=>document.getElementById(id);
const ic=(n,c="")=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const K="lumora_chats",BYE="Este chat se eliminó: Lumora AI no crea vínculos afectivos. Puedes empezar uno nuevo para seguir con tus proyectos.";
let chats=[],cur=null,busy=false,model=null,ctrl=null;
try{chats=JSON.parse(localStorage.getItem(K))||[];}catch{}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(chats));}catch{}};
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
 if(tm){const open=live&&!tm[2],d=el("details","think",`<summary>${ic("spark",open?"spin":"")}<span>${open?"Pensando…":"Razonamiento"}</span>${ic("chev","chev")}</summary>`);
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
  r.appendChild(d);r.onclick=()=>{show(c);$("side").classList.remove("open");};l.appendChild(r);});
}
function show(c,notice){
 cur=c;$("msgs").innerHTML="";$("title").textContent=c?c.title:"Nuevo chat";
 if(notice)$("msgs").appendChild(el("div","notice",notice));
 if(!c||!c.msgs.length)$("msgs").appendChild(el("div","hero",`${ic("spark")}<h2>Lumora AI</h2><div>Pregúntame sobre scripts, sitios web y Lua. Si te entrego un archivo, lo verás listo para descargar.</div>`));
 else c.msgs.forEach((m,i)=>addMsg(m,i===c.msgs.length-1));
 drawList();
}
function del(c,notice){chats=chats.filter(x=>x!==c);save();if(cur===c)show(null,notice);else drawList();}
function newChat(){show(null);$("in").focus();$("side").classList.remove("open");}

/* ---- generación ---- */
async function generate(){
 busy=true;$("send").disabled=true;const c=cur,q=c.msgs[c.msgs.length-1].content;
 const msgs=[{role:"system",content:systemPrompt(recall(q))},...c.msgs.slice(-12).map(m=>({role:m.role,content:m.content}))];
 const w=el("div","m bot",`<div class="ic">${ic("spark")}</div><div class="body"></div>`),body=w.querySelector(".body");
 renderBody("",body,true);$("msgs").appendChild(w);$("msgs").scrollTop=$("msgs").scrollHeight;
 let full="";ctrl=new AbortController();
 try{
  await stream(model,msgs,t=>{full+=t;renderBody(full,body,true);$("msgs").scrollTop=$("msgs").scrollHeight;},ctrl.signal);
  for(const t of full.matchAll(/\[\[APRENDER:\s*([\s\S]*?)\]\]/g))learn(t[1]);
  c.msgs.push({role:"assistant",content:full});save();
  if(/\[\[FIN_CHAT\]\]/.test(full)&&!crisis(q))return del(c,BYE);
 }catch(e){
  c.msgs.push({role:"assistant",content:"No pude generar la respuesta: "+(/Failed to fetch|NetworkError/.test(e.message)?"no encuentro Ollama. Instálalo, inicia el servicio y permite este sitio con OLLAMA_ORIGINS.":e.message)});save();
 }finally{busy=false;$("send").disabled=false;if(cur===c)show(c);}
}
async function submit(){
 const text=$("in").value.trim();if(!text||busy)return;
 if(!cur){cur={id:Date.now(),title:text.slice(0,40),msgs:[],strikes:0};chats.unshift(cur);}
 $("in").value="";$("in").style.height="48px";
 const m=text.match(/^(?:recuerda|aprende|memoriza)(?:\s+que|:)?\s+(.{6,})/i);if(m)learn(m[1]);
 cur.msgs.push({role:"user",content:text});
 if(attachment(text)&&!crisis(text)&&++cur.strikes>=rules().strikes)return del(cur,BYE);
 save();
 if(!model){cur.msgs.push({role:"assistant",content:"Todavía no hay un modelo conectado. Revisa que Ollama esté instalado y en ejecución."});save();return show(cur);}
 show(cur);await generate();
}
function retry(){if(busy||!cur)return;cur.msgs.pop();save();show(cur);generate();}

/* ---- arranque ---- */
$("form").onsubmit=e=>{e.preventDefault();submit();};
$("in").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}};
$("in").oninput=e=>{e.target.style.height="48px";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";};
$("new").onclick=newChat;$("q").oninput=drawList;$("exp").onclick=exportLua;
$("menu").onclick=()=>$("side").classList.toggle("open");$("dev").textContent=device();
(async()=>{
 await Promise.all([loadRules(),loadMemory()]);show(null);
 try{model=await pick();$("st").textContent=model||"Sin modelos";$("dot").className=model?"ok":"";}catch{$("st").textContent="Ollama no responde";}
})();
