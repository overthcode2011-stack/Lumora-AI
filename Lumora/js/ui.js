// Utilidades de interfaz: iconos, globo girando, desplegables propios y avisos.
export const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
export const ic=(n,c="")=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
// Globo terráqueo en blanco y negro: el mapa se desplaza en el eje X dentro de una esfera.
export const globe=()=>`<svg class="globe" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#000"/><g clip-path="url(#gclip)"><g class="map"><use href="#worldmap" transform="translate(0 3) scale(.94)"/><use href="#worldmap" transform="translate(188 3) scale(.94)"/></g><circle cx="50" cy="50" r="47" fill="url(#gshade)"/></g><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" stroke-width="4"/></svg>`;

let open=null;
export function closeMenu(){
 if(!open)return;
 open.el.remove();document.removeEventListener("mousedown",open.out,true);document.removeEventListener("keydown",open.key,true);
 open.anchor.setAttribute("aria-expanded","false");open=null;
}
// Desplegable propio (no usa <select>): items=[{key,name,desc,tag,icon}]
export function menu(anchor,items,o={}){
 if(open&&open.anchor===anchor){closeMenu();return;}
 closeMenu();
 const m=document.createElement("div");m.className="menu";m.setAttribute("role","menu");
 items.forEach(it=>{
  const b=document.createElement("button");b.type="button";b.className="mi"+(it.key===o.selected?" sel":"");b.setAttribute("role","menuitem");
  b.innerHTML=`<span class="mi-ic">${it.icon?ic(it.icon):""}</span><span class="mi-t"><b>${esc(it.name)}</b>${it.desc?`<small>${esc(it.desc)}</small>`:""}</span>${it.tag?`<em class="tag">${esc(it.tag)}</em>`:""}<span class="mi-ck">${it.key===o.selected?ic("check"):""}</span>`;
  b.onclick=()=>{closeMenu();o.onPick&&o.onPick(it);};m.appendChild(b);
 });
 if(o.footer){const f=document.createElement("div");f.className="mf";f.textContent=o.footer;m.appendChild(f);}
 document.body.appendChild(m);
 const r=anchor.getBoundingClientRect();
 m.style.minWidth=Math.max(o.minWidth||260,r.width)+"px";
 const left=o.right?r.right-m.offsetWidth:r.left;
 m.style.left=Math.max(8,Math.min(left,innerWidth-m.offsetWidth-8))+"px";
 if(o.up===false)m.style.top=(r.bottom+8)+"px";else m.style.bottom=(innerHeight-r.top+8)+"px";
 anchor.setAttribute("aria-expanded","true");
 const out=e=>{if(!m.contains(e.target)&&!anchor.contains(e.target))closeMenu();};
 const key=e=>{
  const bs=[...m.querySelectorAll(".mi")],i=bs.indexOf(document.activeElement);
  if(e.key==="Escape"){closeMenu();anchor.focus();}
  else if(e.key==="ArrowDown"){e.preventDefault();bs[(i+1)%bs.length].focus();}
  else if(e.key==="ArrowUp"){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus();}
 };
 document.addEventListener("mousedown",out,true);document.addEventListener("keydown",key,true);
 open={el:m,anchor,out,key};
 (m.querySelector(".mi.sel")||m.querySelector(".mi")).focus();
}
export function toast(t){
 let e=document.getElementById("toast");
 if(!e){e=document.createElement("div");e.id="toast";e.setAttribute("role","status");document.body.appendChild(e);}
 e.textContent=t;e.className="on";clearTimeout(toast.t);toast.t=setTimeout(()=>{e.className="";},3400);
}
