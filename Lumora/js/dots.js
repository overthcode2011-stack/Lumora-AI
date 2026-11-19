// Puntos animados del fondo (estilo neutro del landing original). Se pausan mientras la IA genera.
const c=document.getElementById("dots"),x=c.getContext("2d");
const still=matchMedia("(prefers-reduced-motion:reduce)").matches;
let W,H,S,R=[],on=!still,raf=0;
function size(){const D=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;S=W<700?30:23;c.width=W*D;c.height=H*D;x.setTransform(D,0,0,D,0,0);draw(performance.now(),true);}
function draw(now,once){
 const t=now/1000,cx=W/2,cy=H*.48;
 x.clearRect(0,0,W,H);R=R.filter(r=>now-r.t<2600);
 for(let gy=S/2;gy<H;gy+=S)for(let gx=S/2;gx<W;gx+=S){
  const d=Math.hypot((gx-cx)/(W*.38),(gy-cy)/(H*.4)),fade=Math.min(1,Math.max(.12,(d-.3)/.8)),
   w=(Math.sin(gx*.011+gy*.006-t*1.5)+.6*Math.sin(gy*.019-t*.9+gx*.004)+1.6)/3.2;
  let r=.8+w*1.5,a=.08+w*.42,oy=Math.sin(gx*.011-t*1.5)*3;
  for(const q of R){const age=(now-q.t)/1000,dist=Math.hypot(gx-q.x,gy-q.y),ring=Math.exp(-Math.pow((dist-age*430)/55,2))*Math.max(0,1-age/2.4);r+=ring*2.6;a+=ring*.55;oy-=ring*9;}
  // gris neutro en vez de verde
  x.fillStyle="rgba(90,90,95,"+Math.min(1,a*fade)+")";x.beginPath();x.arc(gx,gy+oy,r,0,6.2832);x.fill();
 }
 if(on&&!once&&!document.hidden)raf=requestAnimationFrame(draw);
}
export function setDots(v){
 if(still)return;
 if(v&&!on){on=true;raf=requestAnimationFrame(draw);}else if(!v){on=false;cancelAnimationFrame(raf);}
}
addEventListener("resize",size);
document.addEventListener("pointerdown",e=>{if(on)R.push({x:e.clientX,y:e.clientY,t:performance.now()});});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&on){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}});
size();if(on)raf=requestAnimationFrame(draw);
